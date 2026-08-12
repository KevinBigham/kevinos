# Local evidence vocabulary

These names make KevinOS receipts interpretable without creating telemetry. No exporter, collector, cloud trace ID, raw context, hidden reasoning, or passive activity stream exists.

| Name | Purpose | Allowed attributes | Retention | Privacy class |
|---|---|---|---|---|
| `kevinos.ai.proposal.applied` | Approved AI proposal changed one supported local target. | operation ID, source, status/times, count, fingerprints, bounded proposal/target IDs, Undo flag | newest 25 operations on this device | metadata; no proposal text or provider payload |
| `kevinos.ai.proposal.undone` | Kevin used the targeted inverse for an application. | same operation facts plus reverted operation ID | newest 25 operations on this device | metadata; no inverse content |
| `kevinos.state.imported` | A verified backup replaced canonical content after confirmation. | operation facts, count, fingerprints, checkpoint reason | newest 25 operations on this device | metadata; no backup content/name |
| `kevinos.state.restored` | A selected snapshot replaced canonical content after confirmation. | operation facts, count, fingerprints, checkpoint reason | newest 25 operations on this device | metadata; no snapshot content |
| `kevinos.friction.marked` | Kevin explicitly marked why NOW or Capture felt hard. | safe ID, surface, optional bounded target kind/ID, fixed category, timestamp | 30 days and newest 200; same mark compacts for 12 hours | device-local behavioral metadata; no task text |

Focus fields, AI Job Receipt v2, mission proof receipts, and recovery-drill metadata are structured evidence but are not generalized event streams. `kevinos.sync.conflict.created` is reserved: it has test fixtures only and must not be emitted until the production conflict gate is approved.

All sidecars fail independently from canonical state and never enter portable backups or sync. The flight recorder is visible in System Health. The friction pilot is off by default and has immediate off and clear controls.
