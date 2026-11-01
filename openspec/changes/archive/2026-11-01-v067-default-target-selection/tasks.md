## 1. Spec
- [x] 1.1 Write the build/run and test default-target requirements.
## 2. Implementation
- [x] 2.1 `beskid_analysis`: `select_default_target` and `select_default_test_targets`; `build` and `run` select through them (slice deftarget).
- [x] 2.2 `beskid test` without `--target` runs every Test target with a combined summary (slice deftarget).
- [ ] 2.3 Give the lib template a Test target and run the templates gate (slice deftarget).
