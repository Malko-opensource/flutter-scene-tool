import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { example } from '../src/example.mjs';
import { validate } from '../src/validate.mjs';
import { schema, supportedKeywords } from '../src/schema.mjs';
import { hash, safePath } from '../src/files.mjs';
import { dimensions } from '../src/images.mjs';
import { sampleScene, sampleLayer } from '../src/sample.mjs';

const clone = () => structuredClone(example);
const temp = t => { const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'scene-tool-test-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jK4sAAAAASUVORK5CYII=', 'base64');
function withImage(t) {
  const root = temp(t); fs.mkdirSync(path.join(root, 'assets')); fs.writeFileSync(path.join(root, 'assets/pixel.png'), png);
  const scene = clone();
  scene.assets = [{ id: 'pixel', path: 'assets/pixel.png', sha256: hash(png), width: 1, height: 1, license: 'CC0-1.0', source: 'Test fixture', redistribution: 'approved' }];
  scene.layers[0].kind = 'image'; scene.layers[0].asset = 'pixel';
  return { scene, root };
}

test('bundled schema uses only supported evaluator keywords', () => {
  function visit(rule) {
    for (const [key, value] of Object.entries(rule)) {
      assert.ok(supportedKeywords.has(key), key);
      if (key === 'properties' || key === '$defs') Object.values(value).forEach(visit);
      if (key === 'items') visit(value);
      if (key === 'prefixItems') value.forEach(visit);
    }
  }
  visit(schema);
});

test('seed contract validates and declares no artwork', () => {
  assert.equal(validate(example).valid, true);
  assert.equal(example.assets.length, 0);
});

for (const [name, mutate, expected] of [
  ['unknown field', s => s.layers[0].timing = 4, 'UNKNOWN_FIELD'],
  ['schema version', s => s.schemaVersion = 2, 'SCHEMA'],
  ['duplicate layer', s => s.layers[1].id = s.layers[0].id, 'DUPLICATE_ID'],
  ['interval', s => s.layers[1].entry.end = s.layers[1].entry.start, 'INVALID_INTERVAL'],
  ['nonfinite number', s => s.layers[1].entry.scale = Infinity, 'SCHEMA'],
  ['wrong layer type', s => s.layers[1].kind = 'rig', 'SCHEMA'],
  ['missing image asset', s => s.layers[1].kind = 'image', 'ASSET_REFERENCE'],
  ['reference on shape', s => s.layers[1].asset = 'ghost', 'UNUSED_REFERENCE'],
  ['off canvas', s => s.layers[1].bounds[0] = 2, 'OFF_CANVAS'],
  ['zero width', s => s.layers[1].bounds[2] = 0, 'SCHEMA'],
  ['anchor range', s => s.layers[1].anchor[1] = 2, 'SCHEMA'],
]) test(`rejects ${name}`, () => {
  const scene = clone(); mutate(scene);
  const result = validate(scene);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.code === expected));
});

test('Unicode labels remain ordinary data', () => {
  const scene = clone(); scene.label = "한글 이야기 ' \" $ \n ";
  assert.equal(validate(scene).valid, true);
});

test('asset header, hash and dimensions are checked', t => {
  const { scene, root } = withImage(t);
  assert.equal(validate(scene, { root }).valid, true);
  scene.assets[0].sha256 = '0'.repeat(64);
  scene.assets[0].width = 2;
  const codes = validate(scene, { root }).errors.map(error => error.code);
  assert.ok(codes.includes('HASH_MISMATCH'));
  assert.ok(codes.includes('DIMENSIONS_MISMATCH'));
});

test('image header checks do not claim to decode images', t => {
  const { scene, root } = withImage(t);
  const result = validate(scene, { root });
  assert.equal(result.checks.imageHeader, true);
  assert.equal(result.checks.flutterDecode, false);
  assert.equal(result.checks.visualQuality, false);
});

test('asset rights are warnings locally and release blockers', t => {
  const { scene, root } = withImage(t);
  scene.assets[0].redistribution = 'unverified';
  assert.equal(validate(scene, { root }).valid, true);
  assert.equal(validate(scene, { root }).warnings[0].code, 'ASSET_RIGHTS');
  assert.equal(validate(scene, { root, release: true }).valid, false);
});

test('missing, mismatched-format and corrupt image files fail clearly', t => {
  const { scene, root } = withImage(t);
  fs.renameSync(path.join(root, 'assets/pixel.png'), path.join(root, 'assets/pixel.jpg'));
  assert.ok(validate(scene, { root }).errors.some(error => error.code === 'ENOENT'));
  scene.assets[0].path = 'assets/pixel.jpg';
  assert.ok(validate(scene, { root }).errors.some(error => error.code === 'IMAGE_FORMAT'));
  fs.writeFileSync(path.join(root, 'assets/pixel.jpg'), 'not an image');
  assert.ok(validate(scene, { root }).errors.some(error => error.code === 'IMAGE_HEADER'));
});

test('path traversal, absolute paths and symlinks are blocked', t => {
  const root = temp(t);
  for (const filename of ['../outside', '/tmp/outside', 'assets/../../outside', 'assets\\outside', './assets/a', 'assets//a']) {
    assert.throws(() => safePath(root, filename), error => error.code === 'UNSAFE_PATH');
  }
  fs.symlinkSync(os.tmpdir(), path.join(root, 'assets'));
  assert.throws(() => safePath(root, 'assets/pixel.png'), error => error.code === 'SYMLINK_PATH');
});

test('schema-valid lexical traversal is rejected without reading files', t => {
  const { scene } = withImage(t); scene.assets[0].path = 'assets/../pixel.png';
  assert.ok(validate(scene).errors.some(error => error.code === 'UNSAFE_PATH'));
});

test('image parser supports PNG, WebP extended, lossless and lossy headers', () => {
  assert.deepEqual(dimensions(png), { width: 1, height: 1, format: 'png' });
  for (const kind of ['VP8X', 'VP8L', 'VP8 ']) {
    const buffer = Buffer.alloc(32); buffer.write('RIFF', 0); buffer.write('WEBP', 8); buffer.write(kind, 12);
    if (kind === 'VP8X') { buffer.writeUIntLE(9, 24, 3); buffer.writeUIntLE(19, 27, 3); }
    if (kind === 'VP8L') { buffer[20] = 47; buffer.writeUInt32LE(9 | (19 << 14), 21); }
    if (kind === 'VP8 ') { Buffer.from([157,1,42]).copy(buffer, 23); buffer.writeUInt16LE(10, 26); buffer.writeUInt16LE(20, 28); }
    assert.deepEqual(dimensions(buffer), { width: 10, height: 20, format: 'webp' });
  }
  assert.equal(dimensions(Buffer.alloc(2)), null);
});

test('entry endpoints settle exactly and are stateless under seeking', () => {
  for (const layer of example.layers) {
    assert.deepEqual(sampleLayer(layer, 1), { offset: [0, 0], scale: 1, opacity: 1 });
    const before = sampleLayer(layer, 0.4); sampleLayer(layer, 0.9);
    assert.deepEqual(sampleLayer(layer, 0.4), before);
    assert.deepEqual(sampleLayer(layer, -10), sampleLayer(layer, 0));
    assert.deepEqual(sampleLayer(layer, 10), sampleLayer(layer, 1));
  }
});

test('pointer and scroll are separate and reduced motion overrides all transforms', () => {
  const layer = clone().layers[2]; layer.depth.scrollScale = 0.2;
  assert.deepEqual(sampleLayer(layer, 0, { pointer: [1, -1], scroll: 1, reduced: true }), { offset: [0, 0], scale: 1, opacity: 1 });
  const atRest = sampleLayer(layer, 1);
  const pointer = sampleLayer(layer, 1, { pointer: [1, -1] });
  const scroll = sampleLayer(layer, 1, { scroll: 1 });
  assert.equal(pointer.scale, atRest.scale);
  assert.deepEqual(scroll.offset, atRest.offset);
  assert.equal(scroll.scale, 1.2);
});

test('all 101 samples stay within finite opacity and positive scale', () => {
  for (let i = 0; i <= 100; i++) for (const layer of sampleScene(example, i / 100).layers) {
    assert.ok(layer.opacity >= 0 && layer.opacity <= 1);
    assert.ok(Number.isFinite(layer.scale) && layer.scale > 0);
    assert.ok(layer.offset.every(Number.isFinite));
  }
});
