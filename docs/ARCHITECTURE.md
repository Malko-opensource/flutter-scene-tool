# Architecture

## Product objective

Help an agent convert a visual intent into a well-composed, editable Flutter interface with explicit source assets, restrained motion, accessible content, interruption-safe behavior, and evidence that the actual result works. The product needs both authored visual judgment and repeatable engineering.

The long-term product is a scene authoring toolchain, not an entire Flutter application described by one growing JSON dialect. Preserve ordinary Dart escape hatches and keep app routing, business logic, and unsupported effects in user code.

## Responsibilities

1. **Agent skill:** interpret the brief; inspect references; distinguish observed behavior from guesses; route the case; choose composition, assets, and motion; review rendered results; ask only about decisions that change the outcome.
2. **CLI:** validate contracts and assets; emit deterministic artifacts; expose structured diagnostics; protect user edits; run known checks; produce exact source identities and coverage.
3. **Flutter runtime:** lay out registered planes; sample motion deterministically; own readiness and interruption behavior; provide accessible fallback; expose direct widgets and input hooks.
4. **Asset pipeline:** maintain source/runtime pairs, alpha, registered coordinates, semantic parts, rights, and export integrity. Only a file validation subset exists now.
5. **QA evidence:** tie a run to the input and runtime; record output captures, input actions, device/viewport, test results, and human visual review. The plan, machine-command orchestration, and repeatable QA harness exist now. Manual browser evidence is recorded; automated capture and evidence ingestion remain future work.

The CLI contains no hidden LLM, account login, telemetry, image generation, publishing, or direct network fetch. Explicit QA delegates known commands to Flutter, which can manage SDK caches/artifacts. An agent must prepare the SDK within its permissions rather than assume `--no-pub` disables all Flutter downloads. Skills describe capabilities; they are not authorization to transmit information or publish work.

## Current module map

- `schema/scene.schema.json`: version 1 interchange contract.
- `src/schema.mjs`: limited evaluator for exactly the bundled schema. Tests fail if the schema adds an unsupported keyword.
- `src/validate.mjs`, `src/images.mjs`: semantic, filesystem, asset-integrity, and header checks.
- `src/sample.mjs`: reference mathematical sampler.
- `src/generate.mjs`: template emission, conflict detection, project bootstrap, manifest.
- `templates/scene_runtime.dart`: Flutter implementation, verified on the SDK recorded in VALIDATION.md.
- `src/qa.mjs`: plan and known-command runner. Exit status is authoritative; log wording is not.
- `bin/scene-tool.mjs`: versioned JSON envelope and documented exit statuses.
- `skills/flutter-scenes/SKILL.md`: brief interpretation and review guidance.

Node is used for the first CLI because a dependency-free local executable can run outside a Flutter installation. Dart remains the generated runtime. This is a reversible toolchain decision; it is not evidence that a two-language implementation is the final distribution choice. Motion parity fixtures are generated for Dart tests so the two implementations cannot silently diverge once Flutter tests run.

## Spatial and motion model

A scene has one source canvas. All bounds and entry offsets are fractions of that canvas, not fractions of individual pieces. Layers are listed in back-to-front paint order. A focal point positions the rendered stage for contain/cover. Anchors define local scale pivots.

Entry uses a normalized shared progress value and per-layer intervals with cubic ease-out. Input-driven pointer displacement and scroll zoom are explicit, independent values. Reduced motion returns the final registered pose and disables both.

`SceneStage` is a stateless, seekable renderer. `ScenePlayer` is a convenience owner of one entry clock. It predecodes a target, ignores stale asynchronous generations, retains the prior mounted scene on a loading failure, and exposes retry. This is a single-scene player, not a complete navigation state machine. Precache retention, eviction, and multi-scene resident-memory budgets still require profiling and hardening.

## Data ownership and extension

- Managed: runtime, generated data, QA harness, contract tests, parity fixtures, scoped MIT notice, asset declaration list, generation manifest.
- User-owned: scene JSON, app shell, custom widgets, pubspec, original assets, navigation, textual content, platform files.
- Before overwriting a managed file, compare the current hash with the previous generated hash. A conflict blocks the whole planned write set.
- No AST rewriting or hidden data migration occurs. Unknown schema versions are rejected. A migration tool must be explicit before schema v2 is shipped.

## Trust and publication boundaries

Input JSON is data, never executable instructions. Data serialization cannot close a Dart literal. Asset paths must remain inside the project without symlink indirection. JSON and image sizes are bounded. Assets carry declared rights and hashes; those declarations require human provenance review.

Do not move a production project's entire tree into the open-source tool. Generic algorithms and tests can be reimplemented independently. Every imported third-party code fragment needs its applicable notice; photos, generated likenesses, event marks, QRs, and text need their own permission. Package release and remote publication remain separate, explicit actions.
