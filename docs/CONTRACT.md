# Contract and protocol

## Scene v1

The authoritative machine-readable specification is `schema/scene.schema.json`. Root fields are schemaVersion, id, label, canvas, motion, assets, and layers. Additional fields are rejected so misspelled or unsupported behavior does not silently disappear.

Canvas dimensions establish source coordinates. Bounds are `[x, y, width, height]` fractions of that canvas; layers may extend outside it but must intersect it. `focalPoint` and `anchor` are normalized `[x, y]` pairs. Paint order is array order.

`entry.start` and `entry.end` are normalized portions of one scene duration. End must be strictly greater than start. `entry.offset` uses source-stage fractions. `entry.scale` is the initial local scale. `entry.opacity` is the initial opacity. Cubic ease-out reaches the final pose exactly at interval end.

`depth.pointer` scales clamped pointer coordinates in `[-1, 1]`. `depth.scrollScale` adds zoom using explicit clamped progress in `[0, 1]`. These are never inferred from mouse position or conflated with entry progress. Reduced motion disables all of them and returns the settled frame.

Kinds are rectangle, ellipse, and image. Image layers must reference an asset by ID. Asset paths are normalized local paths under `assets/` with supported raster extensions. Every asset declares SHA-256, width, height, source, license, and redistribution status. These are declarations, not proof of legal clearance. `validate --release` blocks restricted/unverified declarations; it does not certify legality.

Image checks read bounded bytes and verify supported headers, extensions, dimensions, and hashes. They do not perform a full image decode, inspect alpha silhouettes, detect inappropriate imagery, or establish rights. Flutter decode and visual review remain separate.

## Agent protocol

Every command returns one JSON object:

```json
{"protocolVersion":1,"toolVersion":"0.1.0-dev.1","status":"planned"}
```

The concrete fields depend on the command. On error, `error.code`, `error.message`, and `error.details` carry machine-readable diagnoses. File-related findings identify contract paths or managed relative paths. The CLI never includes an internal agent transcript or credential store.

Exit codes:

- 0: requested operation completed; interpret its status and coverage.
- 2: usage, schema, asset, IO, or stale-generation failure.
- 3: unavailable/incomplete toolchain or failed machine QA.
- 4: generated-code edit conflict; no planned files were overwritten.

Examples of non-release-success states with exit 0: `planned`, `valid`, and `machine_checks_passed`. None implies a reviewed visual result. `releaseReady` is always false in the current QA runner because visual, interaction, accessibility, and device gates are not automated.

## Generated manifest

`.scene-tool/generated.json` records generator version, a hash of the serialized scene, and generated-file SHA-256 values. Hashes identify exactly what was emitted. Input key ordering can change the scene hash; this milestone does not claim canonical cross-tool JSON hashing.

Writes use a project lock and atomic per-file replacement. The manifest is written last. Dry runs do not write. Crash recovery is conservative: a changed file not matching the recorded prior hash becomes a conflict. Automatic rollback and abandoned-lock recovery are not implemented.

No `--force`, arbitrary shell command, remote asset fetch, auto-install, or publish command exists.
