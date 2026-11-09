import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { initProject, emit, render } from '../src/generate.mjs';
import { example } from '../src/example.mjs';
import { runQa, qaPlan } from '../src/qa.mjs';
import { withLock } from '../src/files.mjs';

const executable = fileURLToPath(new URL('../bin/scene-tool.mjs', import.meta.url));
const run = (...args) => {
  const result = spawnSync(process.execPath, [executable, ...args], { encoding: 'utf8' });
  return { ...result, data: JSON.parse(result.stdout) };
};
function project(t) {
  const parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'scene-tool-integration-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'project'); initProject(root);
  return root;
}

test('help and version use JSON protocol', () => {
  assert.equal(run('--help').data.protocolVersion, 1);
  assert.equal(run('--version').status, 0);
});

test('unknown commands, flags, duplicates and unexpected arguments fail', () => {
  for (const args of [['nope'], ['doctor', '--run'], ['sample', '--progress'], ['sample', 'x', '--progress', '1', '--progress', '0'], ['doctor', 'extra'], ['validate', 'x', '--mystery']]) {
    const result = run(...args); assert.equal(result.status, 2); assert.equal(result.data.status, 'error');
  }
});

test('init creates an editable app and refuses an existing destination', t => {
  const root = project(t);
  assert.ok(fs.existsSync(path.join(root, 'lib/main.dart')));
  assert.ok(fs.existsSync(path.join(root, 'lib/custom_scene.dart')));
  assert.ok(fs.existsSync(path.join(root, 'web/index.html')));
  assert.throws(() => initProject(root), error => error.code === 'PROJECT_EXISTS');
});

test('generated projects retain the complete scoped MIT notice', t => {
  const root = project(t);
  const filename = path.join(root, 'THIRD_PARTY_NOTICES/flutter-scene-tool.txt');
  const notice = fs.readFileSync(filename, 'utf8');
  assert.match(notice, /Copyright \(c\) 2026 Flutter Scene Tool contributors/);
  assert.match(notice, /Permission is hereby granted/);
  assert.match(notice, /THE SOFTWARE IS PROVIDED "AS IS"/);
  assert.match(notice, /does not license your own scene data/);
  fs.unlinkSync(filename);
  emit(root, example);
  assert.equal(fs.readFileSync(filename, 'utf8'), notice);
});

test('validating, planning, sampling and QA planning use explicit coverage', t => {
  const root = project(t); const source = path.join(root, 'scene.json');
  assert.equal(run('validate', source).data.valid, true);
  assert.equal(run('plan', source).data.status, 'planned');
  assert.equal(run('sample', source, '--progress', '0.5').data.progress, 0.5);
  const qa = run('qa', source).data;
  assert.equal(qa.status, 'planned'); assert.equal(qa.releaseReady, false);
  assert.equal(qa.coverage.visualReview, 'not_run');
  for (const value of ['-1', '1.1', 'NaN', 'Infinity', '']) assert.equal(run('sample', source, '--progress', value).status, 2);
});

test('malformed JSON and schema violations produce nonzero structured errors', t => {
  const root = project(t); const source = path.join(root, 'scene.json');
  fs.writeFileSync(source, '{');
  assert.equal(run('validate', source).data.error.code, 'INVALID_JSON');
  fs.writeFileSync(source, '{"schemaVersion": 99}');
  const result = run('validate', source);
  assert.equal(result.status, 2); assert.equal(result.data.status, 'invalid');
});

test('invalid UTF-8 input is rejected instead of silently changing text', t => {
  const root = project(t); const source = path.join(root, 'scene.json');
  fs.writeFileSync(source, Buffer.from([123,34,120,34,58,34,255,34,125]));
  assert.equal(run('validate', source).data.error.code, 'INVALID_JSON');
});

test('generation is byte-deterministic and leaves custom code untouched', t => {
  const root = project(t);
  const custom = path.join(root, 'lib/custom_scene.dart'); fs.writeFileSync(custom, '// My edits\n');
  assert.equal(emit(root, example).changed.length, 0);
  const scene = structuredClone(example); scene.label = 'A different story';
  const result = emit(root, scene);
  assert.deepEqual(result.changed.map(item => item.path), ['lib/generated/scene_data.dart']);
  assert.equal(fs.readFileSync(custom, 'utf8'), '// My edits\n');
  assert.deepEqual(render(scene), render(scene));
});

test('modified generated files block all writes before commit', t => {
  const root = project(t);
  const dataPath = path.join(root, 'lib/generated/scene_data.dart');
  const runtimePath = path.join(root, 'lib/generated/scene_runtime.dart');
  const before = fs.readFileSync(dataPath, 'utf8');
  fs.appendFileSync(runtimePath, '// Manual change\n');
  const scene = structuredClone(example); scene.label = 'Changed';
  assert.throws(() => emit(root, scene), error => error.code === 'EDIT_CONFLICT');
  assert.equal(fs.readFileSync(dataPath, 'utf8'), before);
  assert.equal(run('emit', path.join(root, 'scene.json')).status, 4);
});

test('dry-run reports changes without writing or taking a lock', t => {
  const root = project(t);
  const scene = structuredClone(example); scene.label = 'Not saved';
  const before = fs.readFileSync(path.join(root, 'lib/generated/scene_data.dart'), 'utf8');
  assert.equal(emit(root, scene, { dryRun: true }).changed.length, 1);
  assert.equal(fs.readFileSync(path.join(root, 'lib/generated/scene_data.dart'), 'utf8'), before);
  assert.equal(fs.existsSync(path.join(root, '.scene-tool/write.lock')), false);
});

test('concurrent writers are rejected and the lock is cleaned', t => {
  const root = project(t);
  withLock(root, () => assert.throws(() => emit(root, example), error => error.code === 'LOCKED'));
  assert.equal(emit(root, example).changed.length, 0);
});

test('symlinked outputs and forged generated directories cannot redirect writes', t => {
  const root = project(t);
  const target = path.join(root, 'lib/generated/scene_data.dart'); fs.unlinkSync(target);
  fs.symlinkSync(path.join(root, 'lib/custom_scene.dart'), target);
  assert.throws(() => emit(root, example), error => error.code === 'SYMLINK_PATH');
});

test('Dart data encoding cannot interpolate or close a string literal', () => {
  const scene = structuredClone(example); scene.label = "''' ${arbitrary()} \\ 한글";
  const file = render(scene)['lib/generated/scene_data.dart'];
  assert.ok(!file.includes('arbitrary()'));
  const encoded = file.match(/base64Decode\('([^']+)'\)/)[1];
  assert.deepEqual(JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')), scene);
});

test('QA trusts exit status, not text that claims success', () => {
  let calls = 0;
  const result = runQa('/unused', () => { calls++; return { status: 1, stdout: 'Everything passed!', stderr: '' }; });
  assert.equal(calls, 1);
  assert.equal(result.checks[0].status, 'failed');
  assert.equal(result.checks[1].status, 'not_run');
  assert.equal(result.releaseReady, false);
});

test('missing Flutter reports blocked and later checks never run', () => {
  const result = runQa('/unused', () => ({ error: { code: 'ENOENT' }, status: null }));
  assert.equal(result.status, 'incomplete');
  assert.equal(result.checks[0].status, 'blocked');
  assert.equal(result.coverage.webBuild, 'not_run');
});

test('successful machine checks never claim visual, interaction or device QA', () => {
  const calls = [];
  const result = runQa('/unused', (binary, args, options) => { calls.push([binary, args]); assert.equal(options.shell, false); return { status: 0, stdout: '', stderr: '' }; });
  assert.equal(calls.length, 3);
  assert.ok(calls[2][1].includes('--no-web-resources-cdn'));
  assert.equal(result.status, 'machine_checks_passed');
  assert.equal(result.coverage.visualReview, 'not_run');
  assert.equal(result.coverage.realInteraction, 'not_run');
  assert.equal(result.releaseReady, false);
});

test('QA matrix records source identity and interruption cases', () => {
  const plan = qaPlan(example);
  assert.match(plan.sceneHash, /^[0-9a-f]{64}$/);
  assert.equal(plan.viewports.length, 3);
  assert.deepEqual(plan.reducedMotion, [false, true]);
  assert.ok(plan.interaction.some(text => text.includes('A to B to C')));
});

test('QA rejects stale generated code before invoking Flutter', t => {
  const root = project(t); const source = path.join(root, 'scene.json');
  const scene = structuredClone(example); scene.label = 'Unsynchronized edit';
  fs.writeFileSync(source, JSON.stringify(scene));
  const result = run('qa', source, '--run');
  assert.equal(result.status, 2);
  assert.equal(result.data.error.code, 'STALE_GENERATION');
});

test('scene inputs reject symlink files and symlink parent directories', t => {
  const root = project(t); const source = path.join(root, 'scene.json');
  const alias = path.join(root, 'alias.json'); fs.symlinkSync(source, alias);
  assert.equal(run('validate', alias).data.error.code, 'SYMLINK_PATH');
  const linkedRoot = `${root}-link`; fs.symlinkSync(root, linkedRoot);
  assert.equal(run('validate', path.join(linkedRoot, 'scene.json')).data.error.code, 'SYMLINK_PATH');
});
