# Corelib build report

## Run metadata

| field | value |
|---|---|
| final exit code | 132 |
| total duration | 182s |
| commit | c765ef51fec8e4eba15a1165333498574332e3c4 |
| workflow run | https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866969 |
| corelib root | /home/runner/_work/beskid/beskid/compiler/corelib |
| corelib manifest version | 0.1.0 |
| runtime kit prefix | /home/runner/_work/beskid/beskid/compiler/target/native-runtime-kit |
| runtime kit files | 3 |
| runtime kit size | 96K |

## Command outcomes

| command | result | duration |
|---|---|---:|
| resolve Corelib workspace | PASS | 0s |
| quality checks | PASS | 0s |
| resolve Corelib test inputs | PASS | 0s |
| build beskid_cli (release) | PASS | 147s |
| stage native runtime kit | PASS | 33s |
| run Corelib tests | FAIL (exit 132) | 2s |

## Failure diagnostics

### run Corelib tests

```text
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n117 kind=ReturnStatement span=26:5-26:14 bytes=789-798
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n118 kind=Expression span=26:12-26:13 bytes=796-797
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n119 kind=LiteralExpression span=26:12-26:13 bytes=796-797
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n120 kind=Literal span=26:12-26:13 bytes=796-797
beskid-isle-trace event=isle.selected rule=emit_item_statement item=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n110 symbol=StdinFd#syntax__home_runner__work_beskid_beskid_compiler_corelib_beskid_corelib_tests_corelib_tests_obj_beskid_deps_src_corelib_foundation_2ccee2351e6ad293_src_Core_Syscall_Syscall_bd_110
beskid-isle-trace event=isle.emitted item=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n110 elapsed_ms=0
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n98 kind=FunctionDefinition span=19:1-21:2 bytes=621-657
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n99 kind=Visibility span=19:1-19:4 bytes=621-624
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n100 kind=Identifier span=19:9-19:17 bytes=629-637
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n101 kind=Type span=19:5-19:8 bytes=625-628
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n102 kind=PrimitiveType span=19:5-19:8 bytes=625-628
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n103 kind=Block span=19:20-21:2 bytes=640-657
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n104 kind=Statement span=20:5-20:14 bytes=646-655
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n105 kind=ReturnStatement span=20:5-20:14 bytes=646-655
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n106 kind=Expression span=20:12-20:13 bytes=653-654
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n107 kind=LiteralExpression span=20:12-20:13 bytes=653-654
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n108 kind=Literal span=20:12-20:13 bytes=653-654
beskid-isle-trace event=isle.selected rule=emit_item_statement item=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n98 symbol=StdoutFd#syntax__home_runner__work_beskid_beskid_compiler_corelib_beskid_corelib_tests_corelib_tests_obj_beskid_deps_src_corelib_foundation_2ccee2351e6ad293_src_Core_Syscall_Syscall_bd_98
beskid-isle-trace event=isle.emitted item=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n98 elapsed_ms=0
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n122 kind=FunctionDefinition span=31:1-33:2 bytes=909-945
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n123 kind=Visibility span=31:1-31:4 bytes=909-912
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n124 kind=Identifier span=31:9-31:17 bytes=917-925
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n125 kind=Type span=31:5-31:8 bytes=913-916
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n126 kind=PrimitiveType span=31:5-31:8 bytes=913-916
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n127 kind=Block span=31:20-33:2 bytes=928-945
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n128 kind=Statement span=32:5-32:14 bytes=934-943
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n129 kind=ReturnStatement span=32:5-32:14 bytes=934-943
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n130 kind=Expression span=32:12-32:13 bytes=941-942
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n131 kind=LiteralExpression span=32:12-32:13 bytes=941-942
beskid-isle-trace event=ast.node key=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n132 kind=Literal span=32:12-32:13 bytes=941-942
beskid-isle-trace event=isle.selected rule=emit_item_statement item=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n122 symbol=StderrFd#syntax__home_runner__work_beskid_beskid_compiler_corelib_beskid_corelib_tests_corelib_tests_obj_beskid_deps_src_corelib_foundation_2ccee2351e6ad293_src_Core_Syscall_Syscall_bd_122
beskid-isle-trace event=isle.emitted item=/home/runner/_work/beskid/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/obj/beskid/deps/src/corelib_foundation-2ccee2351e6ad293/src/Core/Syscall/Syscall.bd#g1:n122 elapsed_ms=0
beskid-isle-trace event=clif.end outcome=ok elapsed_ms=9 functions=9 imports=3
Generate CLIF (13ms)
|- [1/9] output_writeline_smoke#syntax__home_runner__work_beskid_beskid_compiler_corelib_beskid_corelib_tests_corelib_tests_obj_beskid_root_src_system_OutputWriteLineTests_bd_10
|- [9/9] StderrFd#syntax__home_runner__work_beskid_beskid_compiler_corelib_beskid_corelib_tests_corelib_tests_obj_beskid_deps_src_corelib_foundation_2ccee2351e6ad293_src_Core_Syscall_Syscall_bd_122
Finalize JIT module
Finalize JIT module (0ms)
timeout: the monitored command dumped core
./scripts/ci/corelib-gate.sh: line 62: 16077 Illegal instruction     timeout --kill-after=60s "${timeout_seconds}" "$@"
```

