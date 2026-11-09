# Contributing

Flutter Scene Tool is an early development project. Small changes with reproducible tests are welcome. Discuss a new runtime capability before expanding the scene contract into application logic.

## Local checks

Use Node.js 22 or newer:

```sh
npm test
npm run check
```

No npm dependencies are required. Add a regression test for contract, filesystem, generation, or protocol changes. Keep the bundled schema and its supported evaluator keywords synchronized. Unknown fields should fail rather than silently disappear.

For changes to generated Flutter code, initialize a fresh disposable project, resolve its Flutter packages, then run analysis, all generated tests, and both production/QA web builds. See [browser QA](docs/BROWSER_QA.md) for the separate inspection entry point and coverage rules. The tested SDK baseline is recorded in [validation](docs/VALIDATION.md).

## Ownership and evidence

- Keep app-specific behavior in user-owned files. Do not bypass generated-file conflict checks with blind overwrites.
- Preserve the complete MIT notice in generated distributions. An asset's license and source must be reviewed independently from the code license.
- Use synthetic or redistributable fixtures. Never include private correspondence, credentials, identifiable production data, or assets whose rights are unclear.
- Separate command success, test assertions, observed frames, real input outcomes, accessibility, and performance. A successful build is not visual acceptance.
- Do not automatically replace a visual baseline with the output under test or claim checks that were not run.

The default CI checks the dependency-free Node suite. The manually dispatched Flutter job uses a pinned official Flutter revision and verifies a newly generated project. It does not replace browser or device review.
