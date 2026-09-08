---
title: "beskid up"
description: "Inspect and select direct-download toolchain versions."
---

`beskid up` manages verified direct-install versions.

| Operation | Result |
| --- | --- |
| `check` | Print the configured release manifest. |
| `list` | Print the active direct-install version. |
| `use <version>` | Select an installed immutable version. |
| `remove <version>` | Remove an inactive version. |
| `host-target` | Print the detected host target triple. |

```bash
beskid up host-target
beskid up list
```

`check` requires `BESKID_RELEASE_MANIFEST_URL`. The installation store uses `BESKID_HOME` when set. See [Install Beskid](/docs/getting-started/install/) for channel and upgrade procedures.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
