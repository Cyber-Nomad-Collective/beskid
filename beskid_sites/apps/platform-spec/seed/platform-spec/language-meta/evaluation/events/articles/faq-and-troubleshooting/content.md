import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Locked decisions

| Decision | ID | Summary |
| --- | --- | --- |
| Language `event` keyword | D-LM-EVT-001 | Events are fields, not delegate types |
| Fiber OnCancelled | D-LM-EVT-002 | Cancellation uses same event mechanism |
| Synchronous default | D-LM-EVT-003 | Handlers run on raising fiber |
| Not `Option` | D-LM-EVT-004 | Subscription state is host-managed |

## FAQ

### Can I read an event field like a variable?

No. Event fields are not ordinary value fields. They must not be read like variables.

### Are events thread-safe?

The default is synchronous on the raising fiber. Thread safety depends on the host profile. See the execution specification for details.

### Can I unsubscribe from an event?

Yes. Use `-=` to remove a handler delegate from the subscriber list.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1219** | Event used outside valid scope |
| **E1220** | Invalid capacity hint |
| **E1221** | Subscription target is not an event |
