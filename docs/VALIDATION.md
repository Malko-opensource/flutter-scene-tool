# Validation status

Checked on 2026-11-09. This report records the initial development milestone before GitHub publication. No npm package or hosted application deployment is claimed.

## Executed and passed

**CLI checks**

- JavaScript syntax checks and 43 Node tests pass in Linux with Node.js v24.22.1.
- The earlier 42-test suite passed on macOS with Node v26.11.1, including the default temporary-directory configuration after canonicalizing test temp roots.
- Coverage includes strict contract validation, malformed JSON/UTF-8, numeric edges, IDs, asset references/headers/hashes, rights declarations, traversal/symlink rejection, motion sampling, reduced motion, deterministic generation, preservation/conflicts, locks, dry runs, safe Dart data encoding, stale-generation rejection, exit statuses, and explicit QA coverage.
- Skill frontmatter/structure validation passes. The publication preflight adds a scoped MIT-notice regression, bringing the Linux suite to 43; the recorded Flutter/browser code is unchanged.

**Actual Flutter verification on macOS**

Flutter 3.47.9 / Dart 3.13.7 were used in disposable projects. Dependencies resolved from the existing cache. After explicit user permission, the official Flutter web SDK artifacts were acquired through Flutter's precache command. No unrelated installation or user-project modification was performed.

- `flutter pub get --offline`: exit 0, 24 cached dependencies resolved.
- `flutter analyze --no-pub`: exit 0, no issues found.
- `flutter test --no-pub --reporter expanded`: 12 tests passed, including real harness controls and retry.
- Default app and separate QA harness web release builds passed with `--no-web-resources-cdn`.
- Build output reported an expected CupertinoIcons font-family warning because the package is not included. Material icons used in the fixture rendered; no missing fixture glyph was observed. This warning is recorded rather than hidden.

The tests cover CLI/Dart frame parity, endpoints, reduced motion, stateless seeking, viewport layout, mounting/disposal, latest-target readiness, failure retention/retry, pending unmount, platform motion features, and actual harness button/slider dispatch. Controlled readiness hooks do not replace corrupt-image decoding tests.

**Actual browser observations**

- The production `main.dart` entry point was separately checked at 390×844, 844×390, and 1440×900, DPR 1. The title and sun were visible and contained after the focal-point correction; no uncovered borders were observed.
- The QA entry point was inspected at exact manual progress 0/25/50/75/100%. These are fixed-frame samples, not a continuous frame recording.
- Reduced-motion override at manual 40% produced the settled composition.
- Real Replay controls were used twice.
- With one-second injected readiness delay, rapid A→B→C requests retained A while C was pending, then displayed C. The current scene was checked through rendered pixels/scene semantics, not only the requested-target label.
- An injected preparation failure retained the prior scene. The real Retry control recovered to the requested scene. This was rechecked after the crop correction.
- No browser console warning/error entries were recorded during the checked flows. Observed runtime resources came from localhost, including CanvasKit and fonts.
- A separate reviewer inspected actual local captures and confirmed subject containment/background coverage at the three sizes and reduced-motion correspondence. The reviewer also identified the QA slider bubble/label collision; the narrow inspector fix passed a fresh build/test run and a real browser drag to 0% with no remaining bubble overlap.

Reports: [Node TAP](node-tests.tap), [Mac execution identity](mac-verification.json), and [browser coverage](browser-verification.json). Cloud-only [doctor](doctor.json) and [runner](qa-toolchain.json) reports remain blocked because that executor has no Flutter binary; successful Mac evidence is kept separate.

## Defects found and addressed

- Empty-string progress coercion: corrected and regression-tested.
- Stale generated source attributed to new input during QA: blocked by a generation freshness preflight.
- Source symlink inconsistency: strict input and ancestor checks added.
- macOS temporary-directory aliases in Node tests: canonicalized test roots without weakening production path checks.
- Platform motion preference mismatch: iOS reduceMotion is handled separately from MediaQuery disableAnimations and tested.
- Sun cropping in portrait/landscape: focal point changed from [0.5, 0.5] to [0.7, 0.15], regenerated, rebuilt, and inspected at all three sizes.
- Inspector value-bubble collision: the redundant floating value indicator is disabled; the visible progress label and accessible slider value remain.

## Limits and remaining work

- No full-duration frame/video coverage, frame-gap analysis, FPS/memory benchmarking, or target-device performance claim.
- No comprehensive screen-reader, keyboard, contrast, touch-target, or large-text accessibility audit. Motion behavior and checked controls are only part of accessibility.
- Browser reduced motion was checked through the explicit harness override; platform preference changes are covered by Flutter tests rather than a separate browser-media emulation claim.
- The geometric seed is an engineering fixture, not finished Wonderous-quality art. Its landscape foreground is a thin strip and the portrait crop cuts the rear hill peak under the selected cover framing; real art direction may require breakpoint-specific composition.
- No production routes, back/forward flows, business logic, network service, articulated actors, structural assemblies, or shaders are implemented by this fixture.
- Raster assets have header/provenance declarations and runtime support, but a real raster scene's decoding, alpha quality, silhouette, and rights still require end-to-end review.
- Older/newer Flutter versions, native builds, native platform scaffolding, automatic pubspec merging, and multi-file rollback remain unverified or unimplemented.

The current evidence supports this specific early engineering milestone. It does not certify a complete product or release.
