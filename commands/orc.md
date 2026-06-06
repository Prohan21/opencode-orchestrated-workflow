---
description: Run the opt-in delegated multi-agent coding workflow using planning-with-files
agent: orchestrator
---

Run the orchestrated coding workflow for this requirement:

$ARGUMENTS

Follow the orchestrator protocol exactly:

1. Generate a stable run ID before doing any orchestration work. Use `orc-<YYYYMMDD-HHMMSS>-<short-topic>` unless resuming an existing run.
2. Check the fixed resume pointer `planning/orc_resume_index.md` if the active planning module is unknown, context is uncertain, or this may be a resumed/compacted thread.
3. Classify the run mode: `audit-roadmap`, `greenfield-plan`, `review-only`, `implementation-after-approval`, or `implementation`.
4. Set the mutation policy: `read-only`, `planning-artifacts-only`, or `source-editing-approved`.
5. Print an Operator Run Card with run ID, mode, mutation policy, phase, planning module, context packet, resume state, telemetry status, source-edit permission, and next gate.
6. Ask one clarifying question only if mode ambiguity would change whether source files are edited or materially change architecture, risk, implementation boundaries, or validation.
7. Create or select a self-contained planning module/folder for this run and update `planning/orc_resume_index.md` to point at it.
8. If resuming an existing planning module or continuing after compaction, read `resume_state.md`, `progress.md`, `task_plan.md`, `context_packet.md`, and any phase-critical reports through EOF before deciding the next action. A bounded read such as `limit=200` is not a full-file read unless the output confirms end of file.
9. Dispatch discovery subagents with a Run Mode Contract. Discovery is report-only unless explicitly limited to planning artifacts, and it must include applicable current official docs, public examples, open-source baselines, and package ecosystem research.
10. Dispatch logical tracing subagents with a Run Mode Contract. Tracing is report-only unless explicitly limited to planning artifacts, and it must account for applicable external runtime, architecture, and library documentation.
11. Preserve discovery, trace, and external research outputs under the planning module.
12. Invoke `planning-with-files` as the planning authority.
13. Instruct `planning-with-files` to keep this run's planning artifacts in the selected planning module/folder, never overwrite existing planning files, and produce the detailed artifacts required for the selected mode, including `external_research.md`, `acceptance_criteria.md` when implementation may occur, and telemetry planning artifacts when telemetry is enabled or requested.
14. Create or update `context_packet.md` and `resume_state.md` from discovery, trace, external research, clarifying answers, and verified source references. Create or update telemetry run manifest and optimization notes when telemetry is enabled or requested.
15. Follow the loaded skill's actual instructions for planning artifacts.
16. For `audit-roadmap`, `greenfield-plan`, or `review-only`, dispatch holistic review of the assessment/plan, then stop and summarize without implementation.
17. For `implementation-after-approval`, summarize the plan, risks, waves, and decision points, then ask for approval before source edits.
18. For approved implementation, plan implementation waves with explicit parallel groups and serial-work rationale where needed.
19. Give every implementation worker the Run Mode Contract, run ID, context packet path, relevant raw report paths, external research references, acceptance criteria, and files to independently verify.
20. Dispatch all implementation workers in the same parallel group concurrently; do not serialize same-group work unless a conflict requires it.
21. Track progress only as `planning-with-files` instructs and update `context_packet.md`, `resume_state.md`, and `planning/orc_resume_index.md` when later agents add or correct important context.
22. Dispatch evaluation workers with the Run Mode Contract and context packet. Require independent verification against acceptance criteria, source evidence, and applicable external docs or baselines.
23. Dispatch `wf-integrate` only after source edits, with the final packet and report paths. Require public package and mature baseline due diligence before accepting bespoke low-level helpers.
24. If integration changes files or context, update `context_packet.md` and `resume_state.md`, then dispatch focused final evaluation workers.
25. Dispatch holistic plan evaluator to assess mode fit, planning quality, context handoff quality, external research quality, resume-state quality, verdict quality, and final result.
26. Inform the user clearly when blockers, failures, large rewrite opportunities, weak external research, compaction/resume uncertainty, or product tradeoffs require a decision.
27. Summarize result, including whether implementation was intentionally skipped by mode, whether applicable external research was completed or explicitly skipped with rationale, whether `resume_state.md` is current, final verdict, and where telemetry was captured or expected to be captured.
