#!/usr/bin/env node
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readJson } from '../src/files.mjs';
import { validate } from '../src/validate.mjs';
import { sampleScene } from '../src/sample.mjs';
import { emit, initProject, sceneHash, VERSION } from '../src/generate.mjs';
import { qaPlan, runQa } from '../src/qa.mjs';
import { ToolError } from '../src/errors.mjs';

const usage = `scene-tool ${VERSION}\n\nUsage:\n  scene-tool init <new-directory>\n  scene-tool validate <scene.json> [--release]\n  scene-tool plan <scene.json>\n  scene-tool emit <scene.json> [--dry-run]\n  scene-tool sample <scene.json> [--progress 0..1] [--reduced]\n  scene-tool qa <scene.json> [--run]\n  scene-tool doctor\n\nEvery response is one JSON object on stdout. Input paths are local.\nNo direct network, image generation, publishing, telemetry, or hidden LLM calls.\nExplicit QA invokes Flutter, which may require SDK/cache artifacts.\nScene files must be at the Flutter project root. Assets remain project-relative.\nExit codes: 0 success, 2 invalid input, 3 incomplete QA/toolchain, 4 edit conflict.\n`;

function parse(argv) {
  const values = new Set(['--progress']);
  const flags = new Set(['--release', '--dry-run', '--reduced', '--run', '--json']);
  const options = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (values.has(arg)) {
      if (options[arg] !== undefined || argv[i + 1] === undefined || argv[i + 1].startsWith('--')) throw new ToolError('USAGE', `Missing or duplicate ${arg}`);
      options[arg] = argv[++i];
    } else if (flags.has(arg)) {
      if (options[arg]) throw new ToolError('USAGE', `Duplicate ${arg}`);
      options[arg] = true;
    } else if (arg.startsWith('-')) throw new ToolError('USAGE', `Unknown option ${arg}`);
    else positionals.push(arg);
  }
  return { options, positionals };
}

function execute(argv) {
  if (!argv.length || argv[0] === '--help' || argv[0] === 'help') return { status: 'help', usage };
  if (argv[0] === '--version') return { status: 'ok', version: VERSION };
  const command = argv[0];
  const { options, positionals } = parse(argv.slice(1));
  const allowed = { init: [], validate: ['--release'], plan: [], emit: ['--dry-run'], sample: ['--progress', '--reduced'], qa: ['--run'], doctor: [] };
  if (!Object.hasOwn(allowed, command)) throw new ToolError('USAGE', `Unknown command ${command}`);
  for (const option of Object.keys(options)) if (option !== '--json' && !allowed[command].includes(option)) throw new ToolError('USAGE', `${option} is not supported by ${command}`);
  if (positionals.length !== (command === 'doctor' ? 0 : 1)) throw new ToolError('USAGE', `Unexpected arguments for ${command}`);
  if (command === 'doctor') {
    const result = spawnSync('flutter', ['--version', '--machine'], { encoding: 'utf8', shell: false, timeout: 10000, maxBuffer: 1024 * 1024, env: { ...process.env, CI: 'true', FLUTTER_SUPPRESS_ANALYTICS: 'true' } });
    return { status: result.status === 0 ? 'ok' : 'incomplete', node: process.version,
      flutter: { available: result.status === 0, exitCode: result.status, error: result.error?.code ?? null, versionOutput: result.stdout ?? '' },
      checks: { flutterAnalysis: 'not_run', rendering: 'not_run' } };
  }
  if (command === 'init') return { status: 'ok', ...initProject(positionals[0]) };
  const filename = path.resolve(positionals[0]);
  const root = path.dirname(filename);
  const scene = readJson(filename);
  const validation = validate(scene, { root, release: Boolean(options['--release']) });
  if (command === 'validate') {
    if (!validation.valid) process.exitCode = 2;
    return { status: validation.valid ? 'valid' : 'invalid', ...validation };
  }
  if (!validation.valid) throw new ToolError('INVALID_SCENE', 'Scene validation failed', validation.errors);
  if (command === 'emit') return { status: 'ok', ...emit(root, scene, { dryRun: Boolean(options['--dry-run']) }) };
  if (command === 'sample') {
    const progress = options['--progress'] === undefined ? 1 : Number(options['--progress']);
    if (options['--progress']?.trim() === '' || !Number.isFinite(progress) || progress < 0 || progress > 1) throw new ToolError('USAGE', 'progress must be finite and between 0 and 1');
    return { status: 'ok', ...sampleScene(scene, progress, { reduced: Boolean(options['--reduced']) }) };
  }
  if (command === 'plan') return { status: 'planned', sceneHash: sceneHash(scene),
    implementation: 'Editable 2D layer composition with shared entry progress',
    decisions: [
      { subject: 'rendering', choice: 'Flutter widgets with registered source coordinates', reason: 'Layers retain independent identity, bounds, anchors and semantics' },
      { subject: 'motion', choice: 'Seekable entry curve; independent pointer and scroll inputs', reason: 'Navigation timing must not be mislabeled as mouse parallax' },
      { subject: 'extension', choice: 'User-owned Flutter shell and overlay', reason: 'Custom app behavior is not forced into the scene DSL' },
    ],
    warnings: validation.warnings,
    unsupported: ['Art generation or segmentation', 'Articulated character rigs', 'Structural polygon assembly', 'Water shaders', 'Multi-scene navigation and page routing', 'Automatic typography design'],
    next: ['Review asset provenance', 'Edit scene contract', 'Emit and inspect generated diff', 'Run machine checks', 'Review actual rendered output and real interaction flows'],
  };
  if (command === 'qa') {
    const plan = qaPlan(scene);
    if (!options['--run']) return { status: 'planned', plan, coverage: { machine: 'not_run', visualReview: 'not_run', realInteraction: 'not_run' }, releaseReady: false };
    const generation = emit(root, scene, { dryRun: true });
    if (generation.changed.length) throw new ToolError('STALE_GENERATION', 'Generated code differs from the current scene or runtime. Run emit before QA.', generation.changed);
    const result = runQa(root);
    if (result.status !== 'machine_checks_passed') process.exitCode = 3;
    return { ...result, plan };
  }
}

try {
  const result = execute(process.argv.slice(2));
  if (result.status === 'incomplete') process.exitCode = 3;
  process.stdout.write(`${JSON.stringify({ protocolVersion: 1, toolVersion: VERSION, ...result })}\n`);
} catch (error) {
  process.exitCode = error instanceof ToolError ? error.exitCode : 2;
  process.stdout.write(`${JSON.stringify({ protocolVersion: 1, toolVersion: VERSION, status: 'error', error: { code: error.code ?? 'IO_ERROR', message: error.message, details: error.details ?? [] } })}\n`);
}
