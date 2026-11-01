# Design: shared Corelib (0.6.7)

Measured by slice share: preparation copied 6.43 MB per exercise before and 0 bytes after; six workspace members copied 27 MB before and 0 after. One process for six members took 4.2 s cold against 6.3 s for six processes. The seal verdict is cached per process by size and modification time; a same-size edit inside the timestamp granularity is caught only by the next process.
