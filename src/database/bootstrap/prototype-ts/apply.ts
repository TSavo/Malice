import type { Method, ObjId } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';
import type { ExtractedPrototypeSpec } from './extract.js';

export type ApplyPrototypeOptions = {
  force?: boolean;
};

export type ApplyPrototypeResult = {
  alias: string;
  sourceFile?: string;
  prototypeId: ObjId;
  updatedParent: boolean;
  updatedProperties: string[];
  updatedMethods: string[];
  skippedProperties: string[];
  skippedMethods: string[];
};

function ensureNumber(value: unknown, description: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${description} must be a number`);
  }
  return value;
}

function toMethodRecord(spec: ExtractedPrototypeSpec): Record<string, Method> {
  const result: Record<string, Method> = {};
  for (const [name, method] of Object.entries(spec.methods)) {
    result[name] = { code: method.code };
  }
  return result;
}

export async function applyExtractedPrototypeSpec(
  manager: ObjectManager,
  spec: ExtractedPrototypeSpec,
  options: ApplyPrototypeOptions = {},
): Promise<ApplyPrototypeResult> {
  const { force = false } = options;

  const objectManager = await manager.load(0);
  if (!objectManager) {
    throw new Error(
      'ObjectManager (#0) not found; run minimal bootstrap first',
    );
  }

  const aliases =
    (objectManager.get('aliases') as Record<string, unknown>) || {};

  const prototypeId = ensureNumber(
    aliases[spec.alias],
    `Alias '${spec.alias}'`,
  );

  const prototypeObj = await manager.load(prototypeId);
  if (!prototypeObj) {
    throw new Error(
      `Prototype for alias '${spec.alias}' not found at #${prototypeId}`,
    );
  }

  const updatedProperties: string[] = [];
  const skippedProperties: string[] = [];
  const updatedMethods: string[] = [];
  const skippedMethods: string[] = [];

  const raw = prototypeObj._getRaw();
  const existingProperties = raw.properties ?? {};
  const existingMethods = raw.methods ?? {};

  const toValue:
    | ((value: unknown, seen?: WeakSet<object>, path?: string) => unknown)
    | undefined = (prototypeObj as any).toValue;
  if (!toValue) {
    throw new Error(
      'Internal error: RuntimeObject is missing toValue() converter',
    );
  }

  const parentAlias = spec.parent;
  const parentId = ensureNumber(
    aliases[parentAlias],
    `Alias '${parentAlias}' (parent of '${spec.alias}')`,
  );
  const updatedParent = raw.parent.value !== parentId;

  const nextProperties = { ...existingProperties };
  const nextMethods = { ...existingMethods };

  if (updatedParent) {
    raw.parent = { type: 'objref', value: parentId };
  }

  for (const [key, value] of Object.entries(spec.properties)) {
    const hasOwn = Object.hasOwn(existingProperties, key);

    if (force || !hasOwn) {
      nextProperties[key] = toValue.call(
        prototypeObj as any,
        value,
        new WeakSet(),
        `#${prototypeId}.${key}`,
      ) as any;
      updatedProperties.push(key);
    } else {
      skippedProperties.push(key);
    }
  }

  const desiredMethods = toMethodRecord(spec);

  for (const [name, method] of Object.entries(desiredMethods)) {
    const hasOwn = Object.hasOwn(existingMethods, name);

    if (force || !hasOwn) {
      nextMethods[name] = method;
      updatedMethods.push(name);
    } else {
      skippedMethods.push(name);
    }
  }

  raw.properties = nextProperties;
  raw.methods = nextMethods;

  // Persist once, atomically, without triggering RuntimeObject auto-persist races.
  await manager.update(
    prototypeId,
    {
      parent: raw.parent,
      properties: raw.properties,
      methods: raw.methods,
    },
    true,
  );

  return {
    alias: spec.alias,
    sourceFile: spec.sourceFile,
    prototypeId,
    updatedParent,
    updatedProperties,
    updatedMethods,
    skippedProperties,
    skippedMethods,
  };
}
