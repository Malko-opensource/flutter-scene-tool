# Reproducible browser QA

The generated QA entry point is a development tool, separate from `lib/main.dart`. Its controls are real Flutter controls. Their successful operation proves the harness/runtime path under test, not an application's unimplemented routes, gestures, network service, or business behavior.

This workflow adopts evidence and replay principles from [Stageshow verification](https://github.com/benjitaylor/skills/blob/main/stageshow/references/verify.md). It does not use Stageshow code or treat an animated cursor as actual input.

## Build distinct entry points

With Flutter installed and all required official artifacts available:

```sh
flutter pub get --offline
flutter analyze --no-pub
flutter test --no-pub --reporter expanded
flutter build web --release --no-pub --no-web-resources-cdn
flutter build web --release --no-pub --no-web-resources-cdn --target lib/generated/qa_main.dart --output build/qa-web
```

Offline package resolution requires an existing cache. `--no-pub` does not prevent Flutter from acquiring missing SDK artifacts. Obtain required artifacts only within the user's permission.

Serve each output directory as a separate localhost-only document root, for example with `python3 -m http.server PORT --bind 127.0.0.1 --directory build/web`. Use a second port for `build/qa-web`. Do not serve them as unadjusted subdirectories: the default generated HTML assumes the configured Flutter base path.

## Capture identity

Record source archive identity, generated-file hashes, entry point, build exit code, browser/version, viewport, DPR, content area, time/frame position, reduced-motion mode, and whether controls were visible. Preserve screenshots/video locally when used for inspection. A screenshot of a late frame is not evidence of an entire transition.

## Production fixture

Inspect the default application independently from the harness at portrait, landscape, and wide dimensions. Verify the real text overlay, visible scene, initial/settled state, missing assets, browser errors, and responsive cropping. The geometric seed remains a test fixture rather than finished visual design.

## Harness controls

- **Scene A/B/C:** distinct requested scene instances. In the default shape fixture, their backgrounds are warm neutral, blue, and pink. The visible request label is not proof that a pending scene committed.
- **Replay / R:** remount the player for a new entry.
- **Manual timeline:** seek the stateless renderer with the actual slider, then hide the inspector with **I** or its button before inspecting pixels.
- **Reduced motion override:** inspect the settled pose at several manual progress values. Platform preference handling also needs its own test.
- **Readiness delay:** inject a one-second delay to test repeated input. This is controlled test latency, not a network measurement.
- **Fail next load:** inject a preparation failure for the next requested target. Verify the previous scene remains visible. Hide the inspector to reach the player's real Retry button, then click it and verify recovery.

## Required observations

1. Compare entry start, 25%, 50%, 75%, and end. Add tighter samples around any suspected jump or seam. Review at normal speed as well as fixed frames.
2. Replay twice and inspect the end-to-new-start transition.
3. With delay enabled, request A, B, then C before completion. The final displayed target must be C; stale completions must not overwrite it.
4. Fail a new target, retain the previous scene, then use the actual Retry control. Repeat and verify the controls remain usable.
5. Change viewport or inspector state during playback. Inspect portrait crop, subject registration, controls, text, and overflow.
6. Inspect reduced motion via the explicit override. Separately record any actual platform/media-preference emulation performed; do not infer it from the override.
7. Have a separate reviewer inspect captured frames using the brief and invariants, without the implementer's desired verdict.

Report execution, assertion results, observed frame coverage, independent visual findings, and remaining uncertainty separately. Do not convert successful machine commands into a blanket visual, performance, or accessibility approval. Capture duration and gaps matter if claiming continuous transition coverage.
