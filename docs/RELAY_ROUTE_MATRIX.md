# Relay route matrix

All routes are protected by `X-KevinOS-Token` when configured except rows marked Public. OAuth status is public because the browser polls it with an opaque attempt/session ID. CORS is not auth.

Body classes used by the hardening target: `small` 64 KiB, `ai` 256 KiB, `mail` 512 KiB, `extract` 8 MiB, `sync` 4.5 MiB. Exact enforced byte ceilings live beside the shared reader in `worker.js` and include the JSON envelope.

| Method/path | Access | Input | Side effect / output | Coverage |
|---|---|---|---|---|
| GET `/` | Public | none | capability health | route-auth |
| POST `/council` | Protected | ai | multi-seat AI, optional cache | route-auth, lane-pins, length |
| POST `/ai` | Protected | ai | single-model proposal | route-auth |
| POST `/extract` | Protected | extract | AI event extraction | route-auth |
| POST `/actions` | Protected | ai | AI task proposals | route-auth |
| POST `/summarize` | Protected | ai | fetch URL and summarize | route-auth |
| POST `/capture` | Protected | ai | AI capture classification | route-auth |
| POST `/intake` | Protected | ai | AI profile question/facts | route-auth |
| GET `/push/key` | Protected | none | VAPID public key | route-auth |
| POST `/push/sync` | Protected | mail | store subscription/reminders | route-auth |
| POST `/push/unsubscribe` | Protected | small | delete subscription | route-auth |
| POST `/push/test` | Protected | small | send test notification | route-auth |
| GET `/github/login` | Public | query | begin OAuth | route-auth |
| GET `/github/callback` | Public | query | exchange code/store token | route-auth |
| GET `/github/status` | Public | query | OAuth connection status | route-auth |
| POST `/github/graphql` | Protected | small | GitHub read | route-auth |
| POST `/github/logout` | Protected | small | revoke/delete token | route-auth |
| POST `/sync/pull` | Protected | small | D1 read | route-auth, sync-push |
| POST `/sync/push` | Protected | sync | revisioned D1 write | route-auth, sync-push, convergence |
| POST `/brief` | Protected | ai | AI brief | route-auth |
| POST `/weekly` | Protected | ai | AI weekly review | route-auth |
| POST `/launch` | Protected | ai | AI day narration | route-auth |
| POST `/spend/scan` | Protected | mail | Gmail read + AI | route-auth |
| POST `/swim/scan` | Protected | mail | Gmail read + AI | route-auth |
| POST `/sheets/digest` | Protected | mail | Sheets read + AI | route-auth |
| GET `/google/login` | Public | query | begin OAuth | route-auth |
| GET `/google/callback` | Public | query | exchange code/store account | route-auth |
| GET `/google/status` | Public | query | OAuth connection status | route-auth |
| POST `/google/threads` | Protected | mail | Gmail read | route-auth |
| POST `/google/inbox-scan` | Protected | mail | bounded Gmail/AI scan | route-auth, inbox-intelligence |
| POST `/google/inbox-research` | Protected | mail | bounded Gmail/AI dossiers | route-auth, inbox-intelligence |
| POST `/google/modify` | Protected | small | archive/snooze after user action | route-auth |
| POST `/google/draft` | Protected | mail | AI draft, no send | route-auth |
| POST `/google/overnight` | Protected | small | draft cache generation/read | route-auth |
| POST `/google/send` | Protected | mail | Gmail send after app approval | route-auth |
| POST `/people/enrich` | Protected | mail | Gmail metadata read | route-auth |
| POST `/google/logout` | Protected | small | revoke/delete account | route-auth |
| POST `/calendar/calendars` | Protected | mail | calendar list read | route-auth |
| POST `/calendar/list` | Protected | mail | event read | route-auth |
| POST `/calendar/freebusy` | Protected | mail | availability read | route-auth |
| POST `/calendar/parse` | Protected | mail | AI event proposal | route-auth |
| POST `/calendar/create` | Protected | mail | create after app approval | route-auth |

Unknown routes return 404. Worker-wide auth and rate limiting run before dispatch. The fetch boundary must convert unexpected failures to a safe correlation-ID envelope.
