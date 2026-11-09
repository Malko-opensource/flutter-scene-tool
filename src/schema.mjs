import { readFileSync } from 'node:fs';

export const schema = JSON.parse(readFileSync(new URL('../schema/scene.schema.json', import.meta.url), 'utf8'));
// Deliberately small evaluator for exactly this bundled schema, not a public
// general-purpose JSON Schema implementation. The test suite rejects new,
// unsupported keywords so schema edits cannot silently weaken validation.
export const supportedKeywords = new Set(['$schema', '$id', 'title', '$defs', '$ref', 'type',
  'additionalProperties', 'required', 'properties', 'const', 'enum', 'minLength',
  'maxLength', 'pattern', 'minimum', 'maximum', 'exclusiveMinimum', 'minItems',
  'maxItems', 'prefixItems', 'items']);

export function validateSchema(value, rule = schema, path = '$', errors = []) {
  const fail = message => errors.push({ path, code: 'SCHEMA', message });
  if (rule.$ref) {
    const target = rule.$ref.split('/').slice(1).reduce((v, key) => v[key], schema);
    return validateSchema(value, target, path, errors);
  }
  if ('const' in rule && value !== rule.const) fail(`must equal ${JSON.stringify(rule.const)}`);
  if (rule.enum && !rule.enum.includes(value)) fail(`must be one of ${rule.enum.join(', ')}`);
  const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (rule.type && !(rule.type === 'integer' ? Number.isInteger(value) : rule.type === type)) {
    fail(`must be ${rule.type}`); return errors;
  }
  if (type === 'number') {
    if (!Number.isFinite(value)) fail('must be finite');
    if (rule.minimum !== undefined && value < rule.minimum) fail(`must be >= ${rule.minimum}`);
    if (rule.maximum !== undefined && value > rule.maximum) fail(`must be <= ${rule.maximum}`);
    if (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum) fail(`must be > ${rule.exclusiveMinimum}`);
  }
  if (type === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) fail(`length must be >= ${rule.minLength}`);
    if (rule.maxLength !== undefined && value.length > rule.maxLength) fail(`length must be <= ${rule.maxLength}`);
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) fail(`must match ${rule.pattern}`);
  }
  if (type === 'array') {
    if (rule.minItems !== undefined && value.length < rule.minItems) fail(`needs >= ${rule.minItems} items`);
    if (rule.maxItems !== undefined && value.length > rule.maxItems) fail(`needs <= ${rule.maxItems} items`);
    value.forEach((item, i) => {
      const itemRule = rule.prefixItems?.[i] ?? rule.items;
      if (itemRule) validateSchema(item, itemRule, `${path}[${i}]`, errors);
    });
  }
  if (type === 'object') {
    for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) fail(`missing ${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (rule.properties && Object.hasOwn(rule.properties, key)) validateSchema(item, rule.properties[key], `${path}.${key}`, errors);
      else if (rule.additionalProperties === false) errors.push({ path: `${path}.${key}`, code: 'UNKNOWN_FIELD', message: 'unknown field' });
    }
  }
  return errors;
}
