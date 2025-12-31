import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { applyExtractedPrototypeSpec } from '../database/bootstrap/prototype-ts/apply';
import { extractPrototypeSpecFromSourceText } from '../database/bootstrap/prototype-ts/extract';
import { ObjectDatabase } from '../database/object-db';
import { ObjectManager } from '../database/object-manager';

type CliOptions = {
  force: boolean;
  mongoUri: string;
  dbName: string;
  dir: string;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    force: false,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB || process.env.DB_NAME || 'malice',
    dir: 'src/ts-prototypes',
  };

  for (const arg of argv) {
    if (arg === '--force') opts.force = true;
    else if (arg.startsWith('--mongoUri='))
      opts.mongoUri = arg.slice('--mongoUri='.length);
    else if (arg.startsWith('--dbName='))
      opts.dbName = arg.slice('--dbName='.length);
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
  console.log(
    'Usage: node --import tsx src/scripts/bootstrap-apply.ts [--force] [--dir=src/ts-prototypes]',
  );
  console.log('');
  console.log('Environment:');
  console.log('  MONGO_URI  MongoDB URI (default: mongodb://localhost:27017)');
  console.log('  MONGO_DB   Database name (default: malice)');
  console.log('  DB_NAME    (dev compose) Database name');
  console.log('');
  console.log('Options:');
  console.log(
    '  --force          Overwrite existing methods + properties (and parent)',
  );
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

async function main() {
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

  const db = new ObjectDatabase(opts.mongoUri, opts.dbName);
  await db.connect();

  const manager = new ObjectManager(db);

  const files = await listPrototypeFiles(opts.dir);
  if (files.length === 0) {
    console.log(`No .ts prototype files found in ${opts.dir}`);
    await db.disconnect();
    return;
  }

  console.log(
    `Applying ${files.length} TS prototype file(s) from ${opts.dir}...`,
  );
  console.log(`Mode: ${opts.force ? 'force' : 'apply (non-destructive)'}`);

  for (const file of files) {
    const sourceText = await readFile(file, 'utf8');
    const spec = extractPrototypeSpecFromSourceText(sourceText, file);

    const result = await applyExtractedPrototypeSpec(manager, spec, {
      force: opts.force,
    });

    const updated = [
      result.updatedParent ? 'parent' : null,
      result.updatedProperties.length
        ? `props:${result.updatedProperties.length}`
        : null,
      result.updatedMethods.length
        ? `methods:${result.updatedMethods.length}`
        : null,
    ]
      .filter(Boolean)
      .join(', ');

    const skipped = [
      result.skippedProperties.length
        ? `props:${result.skippedProperties.length}`
        : null,
      result.skippedMethods.length
        ? `methods:${result.skippedMethods.length}`
        : null,
    ]
      .filter(Boolean)
      .join(', ');

    console.log(
      `- ${result.alias} (#${result.prototypeId})${result.sourceFile ? ` from ${result.sourceFile}` : ''}: ` +
        `${updated || 'no changes'}${skipped ? ` (skipped ${skipped})` : ''}`,
    );
  }

  await db.disconnect();
}

main().catch((err) => {
  console.error('bootstrap-apply failed:', err);
  process.exit(1);
});
