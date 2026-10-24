# Design: CLI output defaults (0.6.7)

The level order is error, warning, info, debug. The default threshold is warning. `-v` lowers it to info, `-vv` to debug. `-q` raises it to error and still prints final results (build result, test summary). `--plain` is a style switch and never changes the threshold. Progress is a style element: it needs a TTY and a step that lasts more than about one second. Logs never go to standard output, so standard output holds results and `--error-format=json` lines only. The existing requirement "Ordinary terminal interaction" keeps its rules on cursor control.
