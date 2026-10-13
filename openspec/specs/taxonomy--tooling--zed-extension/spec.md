# Zed Extension Specification

## Purpose

This taxonomy area groups the Beskid Zed editor extension capabilities. The behavioral requirements live in the feature capabilities under `tooling--zed-extension--*`.

## Requirements

### Requirement: Zed Extension conformance status
This taxonomy area SHALL carry no behavioral obligation of its own. Conformance claims for the Zed extension MUST cite the feature capabilities under `tooling--zed-extension--*`.

**Stable ID:** `BSP-REQ-447245C31AC2`

#### Scenario: Conformance cites a feature capability
- **GIVEN** a Zed extension build reports conformance
- **WHEN** the claim is reviewed
- **THEN** it cites requirements from a `tooling--zed-extension--*` feature capability, not from this taxonomy area
