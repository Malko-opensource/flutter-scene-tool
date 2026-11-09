import fs from 'node:fs';
import path from 'node:path';
import { validateSchema } from './schema.mjs';
import { hash, safePath } from './files.mjs';
import { dimensions } from './images.mjs';

export function validate(scene, { root, release = false } = {}) {
  const errors = validateSchema(scene);
  const warnings = [];
  if (errors.length) return { valid: false, errors, warnings };
  const issue = (code, location, message) => errors.push({ code, path: location, message });
  const unique = (items, name) => {
    const ids = new Set();
    items.forEach((item, i) => {
      if (ids.has(item.id)) issue('DUPLICATE_ID', `$.${name}[${i}].id`, `Duplicate ID ${item.id}`);
      ids.add(item.id);
    });
  };
  unique(scene.layers, 'layers'); unique(scene.assets, 'assets');
  const assets = new Map(scene.assets.map(asset => [asset.id, asset]));
  const used = new Set();
  let decodedBytes = 0;
  let encodedBytes = 0;
  scene.assets.forEach((asset, i) => {
    const location = `$.assets[${i}]`;
    decodedBytes += asset.width * asset.height * 4;
    if (asset.redistribution !== 'approved') {
      const finding = { code: 'ASSET_RIGHTS', path: `${location}.redistribution`, message: 'Redistribution is not approved. Code licensing does not grant artwork rights.' };
      (release ? errors : warnings).push(finding);
    }
    // Lexical check still runs when files are not checked.
    if (asset.path.split('/').some(part => !part || part === '.' || part === '..')) issue('UNSAFE_PATH', `${location}.path`, 'Asset paths cannot contain empty or dot segments');
    if (!root) return;
    try {
      const filename = safePath(root, asset.path);
      const stat = fs.statSync(filename);
      if (!stat.isFile() || stat.size > 32 * 1024 * 1024) {
        issue('ASSET_SIZE', location, 'Asset must be a file no larger than 32 MiB'); return;
      }
      const bytes = fs.readFileSync(filename);
      encodedBytes += bytes.length;
      if (hash(bytes) !== asset.sha256) issue('HASH_MISMATCH', `${location}.sha256`, 'Asset bytes differ from the declared SHA-256');
      const actual = dimensions(bytes);
      if (!actual) issue('IMAGE_HEADER', location, 'Cannot recognize a supported PNG, JPEG, or WebP header');
      else {
        if (actual.width !== asset.width || actual.height !== asset.height) issue('DIMENSIONS_MISMATCH', location, 'Image header dimensions differ from the contract');
        const extension = path.extname(asset.path).slice(1).replace('jpg', 'jpeg');
        if (extension !== actual.format) issue('IMAGE_FORMAT', location, 'File extension does not match its image header');
      }
    } catch (error) { issue(error.code ?? 'ASSET_READ', location, error.code === 'ENOENT' ? 'Asset file does not exist' : error.message); }
  });
  scene.layers.forEach((layer, i) => {
    const location = `$.layers[${i}]`;
    if (layer.entry.end <= layer.entry.start) issue('INVALID_INTERVAL', `${location}.entry`, 'end must be greater than start');
    if (layer.kind === 'image') {
      if (!layer.asset || !assets.has(layer.asset)) issue('ASSET_REFERENCE', `${location}.asset`, 'Image layers must refer to a declared asset');
      else used.add(layer.asset);
    } else if (layer.asset !== undefined) issue('UNUSED_REFERENCE', `${location}.asset`, 'Only image layers can reference assets');
    const [x, y, w, h] = layer.bounds;
    if (x >= 1 || y >= 1 || x + w <= 0 || y + h <= 0) issue('OFF_CANVAS', `${location}.bounds`, 'Layer does not intersect the source canvas');
    if (layer.role === 'background' && layer.entry.opacity !== 1) warnings.push({ code: 'BACKGROUND_FADE', path: `${location}.entry.opacity`, message: 'Canvas base remains visible, but fading the artwork may reveal a flat color during entry' });
  });
  for (const asset of scene.assets) if (!used.has(asset.id)) warnings.push({ code: 'UNUSED_ASSET', path: '$.assets', message: `Asset ${asset.id} is not used` });
  if (decodedBytes > 128 * 1024 * 1024) warnings.push({ code: 'DECODE_BUDGET', path: '$.assets', message: 'Estimated RGBA source size exceeds 128 MiB; profile actual device decoding and cache residency' });
  return { valid: errors.length === 0, errors, warnings, estimates: { encodedBytes: root ? encodedBytes : null, sourceRgbaBytes: decodedBytes }, checks: { schema: true, files: Boolean(root), imageHeader: Boolean(root), flutterDecode: false, visualQuality: false } };
}
