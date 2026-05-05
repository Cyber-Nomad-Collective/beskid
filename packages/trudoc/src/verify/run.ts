import { spawnSync } from 'node:child_process';
import type { VerifyStep } from './types';

export function runVerifyStep(step: VerifyStep, cwd: string): void {
	const r = spawnSync(step.cmd, step.args, { stdio: 'inherit', cwd, shell: false });
	if (r.error) throw r.error;
	if (r.status !== 0) process.exit(r.status ?? 1);
}
