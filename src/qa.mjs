import { spawnSync } from 'node:child_process';
import { sceneHash } from './generate.mjs';

export function qaPlan(scene) {
  return {
    sceneHash: sceneHash(scene),
    inspector: { entrypoint: 'lib/generated/qa_main.dart', purpose: 'Development-only controls for timeline, readiness, failure and reduced-motion inspection; not production app interactions' },
    viewports: [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }],
    timeline: [0, 0.25, 0.5, 0.75, 1],
    reducedMotion: [false, true],
    machine: ['flutter_analyze', 'flutter_test', 'flutter_build_web'],
    interaction: ['A to B to C before asset readiness: only C may commit', 'Failed image decode: keep the previous scene and expose retry', 'Repeated retry, target replacement, unmount during loading', 'OS reduced motion and text scale changes', 'Pointer exit/reset, scroll boundaries, narrow and wide viewports'],
    visual: ['Layer registration and subject silhouette', 'Portrait crop and focal subject visibility', 'Text contrast, large text, reading order and controls', 'No seams at entry and endpoint', 'Actual performance on the target device'],
    evidence: 'Record tool version, scene hash, target device, commands and exit codes, timestamped screenshots, and reviewed interaction steps. A successful build or a scripted pointer video is not visual or interaction acceptance.',
  };
}

export function runQa(root, runner = spawnSync) {
  const commands = [
    ['flutter_analyze', ['analyze', '--no-pub']],
    ['flutter_test', ['test', '--no-pub']],
    ['flutter_build_web', ['build', 'web', '--release', '--no-pub', '--no-web-resources-cdn']],
  ];
  const checks = [];
  let blocked = false;
  for (const [id, args] of commands) {
    if (blocked) { checks.push({ id, status: 'not_run', reason: 'A prior command failed or was unavailable' }); continue; }
    const result = runner('flutter', args, { cwd: root, encoding: 'utf8', shell: false, timeout: 300000, maxBuffer: 2 * 1024 * 1024, env: { ...process.env, CI: 'true', FLUTTER_SUPPRESS_ANALYTICS: 'true' } });
    const status = result.error ? 'blocked' : result.status === 0 && !result.signal ? 'passed' : 'failed';
    checks.push({ id, command: ['flutter', ...args], status, exitCode: result.status ?? null,
      signal: result.signal ?? null, error: result.error?.code ?? null,
      stdout: result.stdout ?? '', stderr: result.stderr ?? '' });
    blocked = status !== 'passed';
  }
  return { status: blocked ? 'incomplete' : 'machine_checks_passed', checks,
    coverage: { sourceAnalysis: checks[0].status, flutterTests: checks[1].status,
      webBuild: checks[2].status, visualReview: 'not_run', realInteraction: 'not_run',
      devicePerformance: 'not_run', accessibilityAudit: 'not_run' },
    releaseReady: false,
  };
}
