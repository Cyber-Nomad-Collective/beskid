# Networking Specification

## Purpose

This taxonomy area groups the Corelib networking capabilities: network types and errors, DNS, TCP, UDP and HTTP. The behavioral requirements live in those feature capabilities.

## Requirements

### Requirement: Networking conformance status
This taxonomy area SHALL carry no behavioral obligation of its own. Conformance claims for networking MUST cite the feature capabilities under `core-library--networking--*`.

**Stable ID:** `BSP-REQ-223367046DD9`

#### Scenario: Conformance cites a feature capability
- **GIVEN** an implementation reports conformance for Corelib networking
- **WHEN** the claim is reviewed
- **THEN** it cites requirements from a `core-library--networking--*` feature capability, not from this taxonomy area
