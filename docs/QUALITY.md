# Quality gates and development sequence

## Release quality requires distinct evidence

1. **Contract and asset integrity:** schema, source paths, bounds, hashes, dimensions, provenance declarations, generated source identity.
2. **Flutter engineering:** analyzer, unit/widget tests, build, JS/Dart sampler parity, supported SDK/platform matrix.
3. **Rendered composition:** endpoint registration, alpha edges, subject silhouette, portrait/wide framing, text contrast, content density, loading/error states.
4. **Actual interaction:** real gesture/control dispatch, repeated input, A→B→C while loading, reversal, retry, back/forward, resize, reduced motion, and disposal.
5. **Runtime measurements:** target device/browser, cold/warm decode, memory residency, raster/build timings, shader fallback, sustained interaction. A synthetic unit benchmark is not a device frame-rate claim.
6. **Accessibility:** semantics, keyboard/focus, screen reader order, large text, contrast, reduced motion, and alternate paths for gestures.
7. **Distribution:** public-sample rights, dependency/license inventory, clean install, CI, release archive, supported version policy, security and contribution documentation.

For each check, record passed, failed, blocked, or not_run. Store the scene hash, tool/runtime version, command, exit code, viewport/device, and relevant evidence artifact. Interpret real exit status rather than searching log prose for “success.” A scripted pointer overlay cannot count as a real app interaction test. A successful build cannot count as a visual review.

## Milestone 0: initial development release

Delivered: contract, no-dependency CLI, guarded generation, runtime source, synthetic fixture, JavaScript tests, Flutter test templates, and QA protocol. The fixture passes Flutter analysis, widget tests, default/harness web builds, and recorded browser checks on one SDK. Full continuous-motion, device-performance, and accessibility coverage remain open. Do not advertise this milestone as a complete UI generator.

## Milestone 1: verified Flutter vertical slice

- Pin and run at least one supported Flutter SDK version; choose a compatibility floor from evidence.
- Keep compiled source, parity fixtures, controlled readiness tests, and real browser recovery checks passing as capabilities expand. Add actual corrupt-image decoding fixtures.
- Verify the minimal web bootstrap and add native platform scaffolding without overwriting user source.
- Integrate asset declarations without brittle whole-file pubspec rewriting.
- Automate the manually exercised portrait/landscape/wide frame and reduced-motion captures with traceable evidence.
- Expand the verified real-browser seed flow to representative raster scenes and target devices. Publish no quality claims based solely on the abstract shape seed.

Exit: a reproducible, editable example with vetted raster planes, all relevant checks executed, and limits recorded.

## Milestone 2: art and requirement depth

- Add source/runtime asset pairs, transparent cutout validation, registration aids, alpha-bound checks, and independent provenance records.
- Establish reusable case recipes: depth scene, coherent building assembly, editorial scroll story, actor-supported scene.
- Implement each new runtime capability with a narrow contract extension, deterministic sampling where possible, visual fixtures, and a documented custom-widget escape hatch.
- Add content-safe zones and breakpoint art direction only when concrete examples demonstrate the need.

Exit: several genuinely different, visually reviewed use cases, not many recolors of one template.

## Milestone 3: production workflow and release

- Harden preview/capture, structured evidence import, crash recovery, semantic migration, schema compatibility, and asset bundling.
- Add golden and interaction automation while keeping human visual acceptance distinct.
- Record real-device performance budgets and fallbacks.
- Independently test the agent skill against unfamiliar briefs and existing applications.
- Audit new public fixtures and third-party rights before every release. Preserve the MIT notice and verified ownership; release only with appropriate project authorization.

No dates or commitments are implied by this sequence. Scope and validation determine readiness.
