#!/usr/bin/env python3
"""Trusted build-pipeline receipt for an independently compiled owned driver."""
import argparse, hashlib, json, pathlib, os
p=argparse.ArgumentParser();p.add_argument('--messages');p.add_argument('--target');p.add_argument('--profile',choices=['debug','release']);p.add_argument('--output',required=True);p.add_argument('--snapshot',action='store_true');p.add_argument('--source-snapshot');a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[2]
crate=root/'compiler/crates/beskid_execution'
manifest=(crate/'Cargo.toml').resolve()
h=hashlib.sha256(b'beskid.compiler-driver.source/1')
for name in ['Cargo.toml','src/lib.rs','src/compiler_driver.rs','src/bin/beskid_native_tool_driver.rs']:
    data=(crate/name).read_bytes();n=name.encode();h.update(len(n).to_bytes(8,'little'));h.update(n);h.update(len(data).to_bytes(8,'little'));h.update(data)
if a.snapshot:
    with pathlib.Path(a.output).open('x') as out:json.dump({'source_sha256':h.hexdigest()},out)
    raise SystemExit(0)
if not all([a.messages,a.target,a.profile,a.source_snapshot]):raise SystemExit('missing owned build evidence arguments')
if json.loads(pathlib.Path(a.source_snapshot).read_text())!={'source_sha256':h.hexdigest()}:raise SystemExit('driver source changed during build')
# The member's optimization level is the one the workspace profile declares, not a fixed guess.
import tomllib
_profiles=tomllib.loads((root/'compiler/Cargo.toml').read_text()).get('profile',{})
declared_opt_level=str(_profiles.get({'debug':'dev','release':'release'}[a.profile],{}).get('opt-level',3 if a.profile=='release' else 0))
raw=pathlib.Path(a.messages).read_bytes()
if len(raw)>8*1024*1024: raise SystemExit('driver build messages exceed bound')
finished=[];artifacts=[]
for line in raw.splitlines():
    m=json.loads(line)
    if m.get('reason')=='build-finished': finished.append(m.get('success'))
    if m.get('reason')!='compiler-artifact':continue
    if pathlib.Path(m.get('manifest_path','')).resolve()!=manifest:continue
    t=m.get('target',{})
    if t.get('name')!='beskid_native_tool_driver' or t.get('kind')!=['bin']:continue
    if m.get('profile',{}).get('test') is not False:raise SystemExit('driver test artifact rejected')
    if m.get('profile',{}).get('opt_level')!=declared_opt_level:raise SystemExit('driver optimization profile mismatch')
    exe=m.get('executable')
    if not exe:raise SystemExit('driver executable absent')
    file=pathlib.Path(exe).resolve(strict=True)
    if file.parent.name!=a.profile or file.parent.parent.name!=a.target:raise SystemExit('driver target/profile path mismatch')
    artifacts.append(file)
if finished!=[True] or len(artifacts)!=1:raise SystemExit('driver build did not finish once with one exact artifact')
file=artifacts[0]
if not file.is_file() or file.stat().st_size>128*1024*1024:raise SystemExit('driver executable bound')
receipt={'version':1,'package':'beskid_execution','target':a.target,'source_sha256':h.hexdigest(),'executable':str(file),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
output=pathlib.Path(a.output);output.parent.mkdir(parents=True,exist_ok=True)
with output.open('x') as out:json.dump(receipt,out,sort_keys=True);out.flush();os.fsync(out.fileno())
