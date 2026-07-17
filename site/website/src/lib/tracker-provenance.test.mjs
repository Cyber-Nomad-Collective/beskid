import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const taskDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../beskid_tracker/data/v0.4/tasks',
);

async function readTask(id) {
  const contents = await readFile(path.join(taskDirectory, `${id}.json`), 'utf8');
  return JSON.parse(contents);
}

test('v0.4 tracker records retain audited completion dates', async () => {
  const [kanbanDnd, spineTypecheckGates] = await Promise.all([
    readTask('tracker-kanban-dnd'),
    readTask('spine-typecheck-gates'),
  ]);

  assert.equal(kanbanDnd.completedAt, '2026-06-06');
  assert.match(kanbanDnd.body, /\*\*Completed:\*\* 2026-06-06/);
  assert.equal(spineTypecheckGates.completedAt, '2026-06-06');
  assert.match(spineTypecheckGates.body, /\*\*Completed:\*\* 2026-06-06/);
});

test('v0.4 tracker records retain audited source subjects', async () => {
  const [observabilityPass, containerCi] = await Promise.all([
    readTask('platform-observability-pass'),
    readTask('tracker-container-ci'),
  ]);

  assert.equal(observabilityPass.source.subject, 'Observability pass');
  assert.equal(containerCi.source.subject, 'Fix beskid-tracker container image build in CI');
});
