---
name: flutter-scenes
description: Author or revise editable layered Flutter scenes with flutter-scene-tool, including registered artwork, source-coordinate motion, and rendered QA. Use for illustrated scene interfaces rather than generic Flutter business UI.
---

# Editable Flutter scenes

Use the CLI for deterministic validation and generation. Use visual judgment for composition, artwork, timing, and rendered acceptance. The tool does not generate art or decide whether a design is good.

## Start from the brief

Identify the requested result, target form factors, existing Flutter application, source-art availability, interaction model, and content that must remain exact. Inspect the actual reference and separate source-observed behavior from inferences. “Wonderous-like” may mean registered illustrated depth, gesture-coupled entry, editorial typography, or coherent landmark assembly; do not reduce all cases to mouse parallax.

Read [the casebook](../../docs/CASEBOOK.md) for the relevant branch. If a requirement exceeds schema v1, expose it as custom Flutter work or an explicitly missing capability. Do not add unsupported JSON fields and claim they work.

## Author and revise

- Read the scene schema and use local assets with recorded source, license, hash, dimensions, and redistribution status. Code licenses and asset rights are separate.
- Keep layers registered to one source canvas. Bounds and offsets are stage-relative. Prefer complete rigid masses; do not split roofs or faces arbitrarily to create more moving pieces.
- Treat identity, exact copy, and QR payloads as fixed inputs. Keep production data out of reusable samples. Keep editable text in Flutter, not painted into an illustration.
- Use the CLI's JSON status, diagnostics, and exit codes. Start fresh projects with `init`; validate before `emit`; inspect dry-run changes and preserve user-owned extensions. Never bypass an edit conflict with a blind overwrite.
- Put application-specific content, navigation, and unsupported effects in user-owned Flutter widgets. The generated scene is not the whole application.

## Verify what actually shipped

Use `qa` to obtain the matrix, then run machine checks when Flutter is available. Inspect rendered portrait, landscape, wide, intermediate-entry, endpoint, and reduced-motion states. Test real controls and interrupted loading/navigation. An animation of a cursor is not a control test.

For repeatable scene/runtime inspection, use the separate generated `lib/generated/qa_main.dart` entry point and [browser QA procedure](../../docs/BROWSER_QA.md). Distinguish its injected delay/failure controls from real production app behavior. Inspect the production entry point independently.

Report engineering checks, visual review, real interaction, accessibility, and performance separately. Never call source generation a completed UI or claim an unexecuted check passed. Read [quality gates](../../docs/QUALITY.md) when preparing a release. Publishing and sharing require the user's actual authorization, not this skill.
