---
description: Run the opt-in delegated multi-agent coding workflow using planning-with-files
agent: orchestrator
---

Run the orchestrated coding workflow for this requirement:

$ARGUMENTS

Follow the orchestrator protocol exactly:

1. Classify the run mode: `audit-roadmap`, `greenfield-plan`, `review-only`, `implementation-after-approval`, or `implementation`.
2. Set the mutation policy: `read-only`, `planning-artifacts-only`, or `source-editing-approved`.
3. Ask one clarifying question only if mode ambiguity would change whether source files are edited or materially change architecture, risk, implementation boundaries, or validation.
4. Create or select a self-contained planning module/folder for this run.
5. Dispatch discovery subagents with a Run Mode Contract. Discovery is report-only unless explicitly limited to planning artifacts.
6. Dispatch logical tracing subagents with a Run Mode Contract. Tracing is report-only unless explicitly limited to planning artifacts.
7. Preserve discovery and trace reports under the planning module.
8. Invoke `planning-with-files` as the planning authority.
9. Instruct `planning-with-files` to keep this run's planning artifacts in the selected planning module/folder, never overwrite existing planning files, and produce the detailed artifacts required for the selected mode, including telemetry planning artifacts when telemetry is enabled or requested.
10. Create or update `context_packet.md` from discovery, trace, clarifying answers, and verified source references. Create or update telemetry run manifest and optimization notes when telemetry is enabled or requested.
11. Follow the loaded skill's actual instructions for planning artifacts.
12. For `audit-roadmap`, `greenfield-plan`, or `review-only`, dispatch holistic review of the assessment/plan, then stop and summarize without implementation.
13. For `implementation-after-approval`, summarize the plan, risks, waves, and decision points, then ask for approval before source edits.
14. For approved implementation, plan implementation waves with explicit parallel groups and serial-work rationale where needed.
15. Give every implementation worker the Run Mode Contract, context packet path, relevant raw report paths, and files to independently verify.
16. Dispatch all implementation workers in the same parallel group concurrently; do not serialize same-group work unless a conflict requires it.
17. Track progress only as `planning-with-files` instructs and update `context_packet.md` when later agents add or correct important context.
18. Dispatch evaluation workers with the Run Mode Contract and context packet. Require independent verification.
19. Dispatch `wf-integrate` only after source edits, with the final packet and report paths.
20. If integration changes files or context, update `context_packet.md` and dispatch focused final evaluation workers.
21. Dispatch holistic plan evaluator to assess mode fit, planning quality, context handoff quality, and final result.
22. Inform the user clearly when blockers, failures, large rewrite opportunities, or product tradeoffs require a decision.
23. Summarize result, including whether implementation was intentionally skipped by mode and where telemetry was captured or expected to be captured.
