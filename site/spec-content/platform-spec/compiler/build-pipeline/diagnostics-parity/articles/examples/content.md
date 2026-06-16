---
title: Diagnostics parity (CLI and LSP) - Examples
description: Practical examples comparing CLI and LSP diagnostics for equivalent failures.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

- **Syntax error in file:** CLI points to file path; LSP cold path may show `source.bd`, but location/rule category should match.
- **Semantic rule violation:** both CLI-lowering and LSP report equivalent rule failures.
- **Manifest error:** CLI and LSP project parsing surfaces report project diagnostics, not code syntax diagnostics.
