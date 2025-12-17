import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import assert from 'node:assert/strict';

import { ObjectDatabase } from '../database/object-db.js';
import { ObjectManager } from '../database/object-manager.js';
import { extractPrototypeSpecFromSourceText } from '../database/bootstrap/prototype-ts/extract.js';
import type { ExtractedPrototypeSpec } from '../database/bootstrap/prototype-ts/extract.js';
import { applyExtractedPrototypeSpec } from '../database/bootstrap/prototype-ts/apply.js';

type CliOptions = {
  mongoUri: string;
  dbName: string;
  dir: string;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB || process.env.DB_NAME || 'malice',
    dir: 'src/ts-prototypes',
  };

  for (const arg of argv) {
    if (arg.startsWith('--mongoUri=')) opts.mongoUri = arg.slice('--mongoUri='.length);
    else if (arg.startsWith('--dbName=')) opts.dbName = arg.slice('--dbName='.length);
    else if (arg.startsWith('--dir=')) opts.dir = arg.slice('--dir='.length);
    else if (arg === '--help' || arg === '-h') {
      throw new Error('help');
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp(): void {
  console.log('Usage: node --import tsx src/scripts/bootstrap-e2e.ts [--dir=src/ts-prototypes]');
  console.log('');
  console.log('Environment:');
  console.log('  MONGO_URI  MongoDB URI (default: mongodb://localhost:27017)');
  console.log('  MONGO_DB   Database name (default: malice)');
  console.log('  DB_NAME    (dev compose) Database name');
  console.log('');
  console.log('Options:');
  console.log('  --dir=PATH       Directory to scan for .ts prototype files');
  console.log('  --mongoUri=URI   Override Mongo connection URI');
  console.log('  --dbName=NAME    Override Mongo database name');
}

async function listPrototypeFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && extname(e.name) === '.ts')
    .map((e) => join(dir, e.name))
    .sort();
}

async function loadSpecs(files: string[]): Promise<ExtractedPrototypeSpec[]> {
  const specs: ExtractedPrototypeSpec[] = [];
  for (const file of files) {
    const sourceText = await readFile(file, 'utf8');
    specs.push(extractPrototypeSpecFromSourceText(sourceText, file));
  }
  return specs;
}

async function verifySpecs(manager: ObjectManager, specs: ExtractedPrototypeSpec[]): Promise<void> {
  const root = await manager.load(0);
  assert(root, 'ObjectManager (#0) not found');

  const aliases = (root.get('aliases') as Record<string, unknown>) || {};

  for (const spec of specs) {
    const objectId = aliases[spec.alias];
    assert.ok(typeof objectId === 'number', `Alias '${spec.alias}' must exist and be a number`);

    const obj = await manager.load(objectId);
    assert.ok(obj, `Object for alias '${spec.alias}' not found at #${objectId}`);

    const parentId = aliases[spec.parent];
    assert.ok(typeof parentId === 'number', `Alias '${spec.parent}' (parent of '${spec.alias}') must be a number`);
    assert.equal(obj.getParent(), parentId, `#${objectId} parent mismatch`);

    const ownProps = obj.getOwnProperties();
    for (const [key, expected] of Object.entries(spec.properties)) {
      assert(key in ownProps, `#${objectId} missing own property '${key}'`);
      assert.deepEqual(ownProps[key], expected, `#${objectId}.${key} mismatch`);
    }

    const ownMethods = obj.getOwnMethods();
    const expectedMethods = Object.keys(spec.methods);

    const missing = expectedMethods.filter((name) => !(name in ownMethods));
    assert.deepEqual(missing, [], `#${objectId} missing own method(s): ${missing.join(', ')}`);

    // Intentionally not comparing method code while migrating TS prototypes.
    // Extra methods on the DB object are allowed.

    console.log(`✅ Verified ${spec.alias} (#${objectId}) from ${spec.sourceFile ?? 'unknown file'}`);
  }
}

async function main(): Promise<void> {
  let opts: CliOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof Error && err.message === 'help') {
      printHelp();
      process.exit(0);
    }
    throw err;
  }

  const files = await listPrototypeFiles(opts.dir);
  if (files.length === 0) {
    console.log(`No .ts prototype files found in ${opts.dir}`);
    return;
  }

  const specs = await loadSpecs(files);

  const db = new ObjectDatabase(opts.mongoUri, opts.dbName);
  await db.connect();

  try {
    const manager = new ObjectManager(db);

    console.log(`Applying ${files.length} TS prototype file(s) from ${opts.dir} (force)...`);
    for (const spec of specs) {
      const result = await applyExtractedPrototypeSpec(manager, spec, { force: true });
      console.log(`- ${result.alias} (#${result.prototypeId}): props:${result.updatedProperties.length}, methods:${result.updatedMethods.length}`);
    }

    console.log('Verifying applied prototypes...');
    await verifySpecs(manager, specs);
  } finally {
    await db.disconnect();
  }
}

main().catch((err) => {
  console.error('bootstrap-e2e failed:', err);
  process.exit(1);
});
