# Flutter Scene Tool

**Early development release (`0.1.0-dev.1`). Open source under MIT; not production-ready.**

Build editable Flutter scenes with explicit layers, reproducible motion, and a reviewable asset contract. An agent makes the visual decisions. The CLI validates and performs deterministic operations. Flutter remains the application runtime and escape hatch.

This repository starts from the architecture needed for a finished product. Its first implemented vertical slice is contract → validation → editable Flutter source → machine QA protocol. It does not yet produce finished Wonderous-quality artwork or guarantee a polished UI from a sentence.

## Run locally

Node.js 22 or newer is required. There are no npm dependencies or model API keys. The CLI makes no direct network requests. Explicit Flutter commands can manage their own SDK caches/artifacts; use a prepared SDK and offline package resolution when network access is not authorized.

```sh
git clone https://github.com/Malko-opensource/flutter-scene-tool.git
cd flutter-scene-tool
node --test
node bin/scene-tool.mjs init /absolute/path/to/a-new-scene
node bin/scene-tool.mjs validate /absolute/path/to/a-new-scene/scene.json
node bin/scene-tool.mjs plan /absolute/path/to/a-new-scene/scene.json
node bin/scene-tool.mjs emit /absolute/path/to/a-new-scene/scene.json --dry-run
node bin/scene-tool.mjs emit /absolute/path/to/a-new-scene/scene.json
node bin/scene-tool.mjs sample /absolute/path/to/a-new-scene/scene.json --progress 0.5
node bin/scene-tool.mjs qa /absolute/path/to/a-new-scene/scene.json
```

Every command emits one JSON envelope on stdout. The `--json` flag is accepted for agent conventions but JSON is already the default. Consume the exit code, `status`, and `coverage`; do not infer success from prose inside command logs.

Flutter 3.47.9 or newer with Dart 3.13 or newer is separately required. The generated fixture has passed analysis, 12 Flutter tests, two web release builds, and recorded browser checks on Flutter 3.47.9 / Dart 3.13.7 on macOS. Browser coverage includes selected frames, viewports, real harness controls, and recovery. This is not a complete performance, accessibility, or continuous-motion certification. See [validation status](docs/VALIDATION.md).

## What is implemented

- Versioned JSON scene contract with strict unknown-field rejection and explicit capabilities.
- Layer identity, role, source-coordinate bounds, anchor, paint order, image provenance, entry intervals, pointer depth, and scroll scale.
- Pure seekable motion sampling with reduced-motion semantics. Pointer movement and scroll-driven zoom are separate inputs.
- Local PNG/JPEG/WebP header, dimension, size, integrity, path, and redistribution-declaration checks.
- Deterministic Flutter data/runtime generation. Dart string injection is avoided through a base64 data payload.
- User-owned `lib/main.dart`, `lib/custom_scene.dart`, and `pubspec.yaml`. Generation never rewrites these.
- Hash-guarded generated files, dry runs, write locks, symlink rejection, atomic individual writes, and conflict errors before writes.
- Flutter runtime with shared entry timing, source registration, responsive contain/cover, bounded image decode width, asset readiness, stale-target rejection, and separate platform reduce-motion handling.
- Machine QA orchestration that rejects stale generated code and keeps compilation, tests, visual review, interaction, performance, and accessibility coverage separate.
- A separate generated QA entry point with real scene/replay controls, a timeline slider, reduced-motion override, and injected readiness delay/failure for repeatable inspection.
- Generated projects retain the full scoped MIT notice without applying it to user-authored scene data or assets.
- A small portable agent skill at [skills/flutter-scenes/SKILL.md](skills/flutter-scenes/SKILL.md).

The abstract landscape seed uses only original geometric shapes. It is a contract fixture, not a design-quality demonstration.

## Flutter integration

After `init`, install a supported Flutter SDK and inspect the generated project.

```sh
cd /absolute/path/to/a-new-scene
flutter pub get
flutter analyze
flutter test
flutter build web --release --no-web-resources-cdn
```

A minimal user-owned `web/index.html` uses the [official Flutter bootstrap mechanism](https://docs.flutter.dev/platform-integration/web/initialization). Native platform shells are not generated.

Inputs and project ancestry reject symlinks. On macOS, use a canonical path such as `/private/tmp/my-scene` rather than the `/tmp` alias.

`scene-tool qa scene.json --run` runs `flutter analyze --no-pub`, `flutter test --no-pub`, and `flutter build web --release --no-pub --no-web-resources-cdn`, in that order. It stops at the first failure. It does not install Flutter, retrieve packages, or add native platforms.

For images, keep the original editable source separately, put runtime files under `assets/`, and declare their hashes and provenance in `scene.json`. Add every exact asset path from `.scene-tool/assets.json` to the user-owned `pubspec.yaml`. Automatic pubspec merging is not implemented. The CLI does not download or copy image files.

For existing Flutter applications, integrate the generated runtime and data through your own widgets. This milestone only scaffolds fresh directories; it does not rewrite an existing application or its routing.

## Change ownership

`scene.json` is the editable contract. `lib/custom_scene.dart` holds ordinary Flutter composition, accessible content, and app-specific behavior. `lib/generated/` is managed output. If generated code was edited, `emit` exits with code 4 and stops before changing any outputs. Move the extension into a user-owned widget or review a deliberate merge. There is no destructive `--force` option.

The manifest commits last. A crash can leave partially replaced files that the next run detects. This is per-file atomicity, not an all-files transaction. Never treat the workspace as safe against an adversarial process concurrently replacing files.

## Current scope and limits

Not implemented: asset generation/segmentation, art direction automation, structural polygon assemblies, water shaders, articulated actors, multi-scene routing, typography/layout intelligence, automated screenshot/golden capture, visual scoring, package publishing, or production performance guarantees. The scene contract deliberately does not pretend to support them.

This is an early source release on GitHub. npm registry publication is intentionally disabled with `private: true`; run the CLI from the checkout. The source code is licensed under MIT. No event portraits, logos, QR codes, event copy, correspondence, or third-party artwork are bundled.

## Development

Run `npm test` or `npm run check`. Node CI runs on pushes and pull requests; a manually dispatched job verifies generated Flutter projects against a pinned official SDK. See [contributing](CONTRIBUTING.md). CI success is separate from the recorded browser checks.

## Design documents

- [Architecture and finished-product boundaries](docs/ARCHITECTURE.md)
- [Requirement routing and case decisions](docs/CASEBOOK.md)
- [Scene contract and agent protocol](docs/CONTRACT.md)
- [Quality gates and release roadmap](docs/QUALITY.md)
- [Actual browser and transition QA](docs/BROWSER_QA.md)
- [Provenance and redistribution](NOTICE.md)
- [Executed checks and remaining limits](docs/VALIDATION.md)

## License

[MIT](LICENSE) for the code in this repository. Generated projects include a scoped copy at `THIRD_PARTY_NOTICES/flutter-scene-tool.txt`; preserve it when redistributing copied source or binaries. Code licenses do not establish rights to artwork, photos, likenesses, fonts, or trademarks. See [NOTICE.md](NOTICE.md).
