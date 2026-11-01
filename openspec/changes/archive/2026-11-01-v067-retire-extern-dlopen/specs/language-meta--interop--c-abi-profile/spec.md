## MODIFIED Requirements

### Requirement: Runtime dlopen Proposed appendix: Decision [D-LMETA-CABI-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The dynamic resolution profile is retired together with the engine feature `extern_dlopen`. Runtime `dlopen` and `dlsym` resolution is not a Standard path. Only the JIT backend resolves symbols at run time, as "Extern resolution fails closed" in `execution--abi-and-host--extern-dispatch-and-policy` states. Conformance matrices SHALL NOT require `dlopen` for Standard tier-1.

**Stable ID:** `BSP-REQ-C6967A267A17`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0003-dynamic-resolution-proposed/content.md`  
**Source SHA-256:** `8938aa59711eb7b0e7b1ad15c6829ee3e05bce31cfd822e50cd7963b497a777c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
