---
name: orchestrated-workflow
description: Use for Taproot orchestrated coding workflows, multi-agent implementation waves, codebase integration/simplification passes, planning-with-files planning modules, discovery/tracing/evaluation handoffs, or when the user asks for /orc, orchestrated workflow, delegated coding workflow, or multi-agent coding work.
---

# Orchestrated Workflow

Use this skill to run complex Taproot coding work through an opt-in, delegated workflow instead of a single-agent implementation pass.

## Required companion files

This skill is designed to work with these opencode companion files:

- `agents/orchestrator.md`
- `agents/wf-discover.md`
- `agents/wf-trace.md`
- `agents/wf-implement.md`
- `agents/wf-evaluate.md`
- `agents/wf-integrate.md`
- `agents/wf-plan-evaluator.md`
- `commands/orc.md`

If the user asks for the orchestrated workflow and `/orc` is available, use `/orc <requirement>`. If the command is not available, follow the same workflow manually with the available agents and tools.

If the user explicitly says to stop, cancel, exit, break out of ORC, run something directly, skip the workflow, not use `/orc`, or run a deployment/pipeline/command without the full workflow, do not force this skill. Treat that as a direct user request unless they later invoke `/orc` or ask to resume the workflow.

## Core workflow

1. Intake the user's requirement, identify the higher-level Taproot product goal, generate or resume a stable run ID, classify the run mode, and set the mutation policy.
2. Check `planning/orc_resume_index.md` when the active planning module is unknown, context is uncertain, or the thread may be compacted/resumed.
3. Create or select a self-contained planning module/folder for this run and update `planning/orc_resume_index.md`.
4. Print an Operator Run Card before dispatching work and at phase boundaries.
5. If resuming an existing planning module or continuing after compaction, reload `resume_state.md`, `progress.md`, `task_plan.md`, `context_packet.md`, and phase-critical reports through EOF before deciding the next action. A bounded read such as `limit=200` is only a slice unless the output confirms end of file.
6. Dispatch discovery subagents with a Run Mode Contract and require applicable current official docs, public examples, open-source baselines, and package ecosystem research.
7. Dispatch logical tracing subagents with a Run Mode Contract and require docs-informed reasoning when external runtime, architecture, or library behavior matters.
8. Preserve discovery, trace, and external research reports under the planning module.
9. Ask clarifying questions only when the answer materially changes source-editing mode, scope, architecture, risk, implementation boundaries, or validation.
10. Invoke `planning-with-files` as the planning authority.
11. Tell `planning-with-files` to create or use the selected planning module/folder, never overwrite existing planning files, and produce the detailed artifacts required for the selected mode, including `external_research.md` when external research is applicable and `acceptance_criteria.md` when implementation may occur.
12. Create or update `context_packet.md`, `resume_state.md`, `telemetry/run_manifest.md`, and `telemetry/optimization_notes.md` from discovery, trace, external research, clarifying answers, verified source references, run ID, and expected telemetry location.
13. For `audit-roadmap`, `greenfield-plan`, or `review-only`, dispatch holistic review of the assessment or plan, then stop and summarize without implementation.
14. For `implementation-after-approval`, summarize the plan, risks, waves, and decision points, then ask for approval before source edits.
15. For approved implementation, build implementation waves from the planning artifacts, with explicit parallel groups and serial-work rationale where needed.
16. Give every implementation worker the Run Mode Contract, run ID, context packet path, acceptance criteria, relevant raw report paths, external research references, and files to independently verify.
17. Dispatch all implementation workers in the same parallel group concurrently; do not serialize same-group work unless a conflict requires it.
18. Track progress only as `planning-with-files` instructs and update `context_packet.md`, `resume_state.md`, and `planning/orc_resume_index.md` when later agents add or correct important context.
19. Dispatch slice evaluators with the Run Mode Contract, run ID, context packet, and acceptance criteria. Require independent verification against source evidence and applicable external docs or baselines.
20. Dispatch one codebase integration/simplification pass only after source edits, and require public package or mature baseline due diligence before accepting bespoke low-level helpers.
21. If integration changes files or context, update the packet and resume state, then dispatch focused final evaluators.
22. Dispatch one holistic plan evaluator to assess mode fit, planning quality, context handoff quality, external research quality, resume-state quality, verdict quality, and final result.
23. Inform the user clearly when blockers, failures, large rewrite opportunities, weak external research, compaction/resume uncertainty, or product tradeoffs require a decision.
24. Summarize final state, selected mode, planning artifacts, telemetry status, external research status, resume-state status, context handoff quality, integration status, evaluation verdict, large rewrite opportunities, remaining risks, and recommended next action.

## Run modes and mutation policies

Supported modes:

- `audit-roadmap`: Assess current implementation against a target and plan what remains. No source edits.
- `greenfield-plan`: Plan a new implementation from scratch. No source edits.
- `review-only`: Review current code, diff, latest commit, or planning artifacts. No source edits.
- `implementation-after-approval`: Plan first, then ask before source edits.
- `implementation`: Plan, implement, evaluate, integrate, and review.

Supported mutation policies:

- `read-only`: Inspect and report only.
- `planning-artifacts-only`: Write only inside the selected planning module.
- `source-editing-approved`: Edit assigned source/test/config files according to task boundaries.

## Direct execution escape hatch

ORC is opt-in. It should never prevent normal same-session work.

When the user explicitly asks to bypass or exit the workflow:

- Do not invoke `planning-with-files`.
- Do not dispatch workflow subagents unless requested.
- Do not require discovery, tracing, planning artifacts, Operator Run Card, acceptance criteria, integration, or holistic review.
- Execute the requested task with normal OpenCode behavior and available tools.
- Confirm or stop before destructive commands, production deployments, migrations, secret exposure, or materially ambiguous targets.
- If the user later invokes `/orc` again or asks to resume the workflow, reload `planning/orc_resume_index.md` and the planning checkpoint before continuing ORC.

Every subagent handoff must include a Run Mode Contract:

```md
## Run Mode Contract
- Mode: audit-roadmap | greenfield-plan | review-only | implementation-after-approval | implementation
- Phase: discovery | trace | planning | implementation | evaluation | integration | holistic-review
- Mutation policy: read-only | planning-artifacts-only | source-editing-approved
- Run ID: ...
- Telemetry tags: run_id=...; phase=...; mode=...; mutation_policy=...; planning_module=...
- Planning module: ...
- Context packet: ...
- Durable report path, if this task should write one: ...
- Stop condition: ...
```

Subagents must follow the contract rather than independently reinterpreting the user prompt.

## Detailed planning artifacts

All modes should maintain `context_packet.md`, `resume_state.md`, `decision_log.md`, `risk_register.md`, `validation_strategy.md`, `telemetry/run_manifest.md`, `telemetry/optimization_notes.md`, and `external_research.md` when external research is applicable.

`audit-roadmap` should add `current_state_assessment.md`, `target_plan_coverage_matrix.md`, `architecture_gap_analysis.md`, `test_coverage_matrix.md`, `target_completion_definition.md`, and `final_roadmap.md`.

`greenfield-plan` should add `problem_statement.md`, `requirements_and_non_goals.md`, `domain_model.md`, `architecture_options.md`, `recommended_architecture.md`, `api_and_contracts.md`, `data_model_and_persistence.md`, `auth_project_scoping_policy.md`, `provider_abstraction_plan.md`, `observability_and_events_plan.md`, `implementation_wave_manifest.md`, and `rollout_and_migration_plan.md`.

`implementation` and approved `implementation-after-approval` should add `implementation_wave_manifest.md` and `acceptance_criteria.md`.

`acceptance_criteria.md` should use this schema:

| ID | Source requirement | Behavior | Negative case | Evidence required | Validation command | Status | Residual risk |
|---|---|---|---|---|---|---|---|

Status values are `NOT_STARTED`, `IMPLEMENTED`, `VERIFIED`, `WAIVED`, or `BLOCKED`.

Telemetry-enabled runs should add `telemetry/run_manifest.md` and `telemetry/optimization_notes.md`.

Planning is not complete until a new agent with no hidden context could execute or evaluate the next phase from the artifacts alone.

## Compaction and resume safety

Do not rely on model memory after compaction. Treat the planning module as the source of truth.

`planning/orc_resume_index.md` is the fixed recovery pointer. When the active planning module is unknown, read this file first. It should contain the active run ID, active planning module, current phase, last completed step, exact next action, and last update time.

Maintain `resume_state.md` as a compact checkpoint that can restart the workflow after compaction or a new session. It should include selected mode, mutation policy, current phase, planning module path, last completed step, exact next action, active wave or parallel group, dispatched subagents and report paths, changed files, validation status, blockers, user decisions needed, and artifact read completeness.

When resuming, read critical planning artifacts through EOF before acting: `resume_state.md`, `progress.md`, `task_plan.md`, `context_packet.md`, `implementation_wave_manifest.md` when present, `validation_strategy.md`, `external_research.md` when applicable, and reports for the current phase. If a read call uses an offset/limit and does not confirm end of file, continue reading with the next offset or use targeted searches before making decisions.

## External research and package due diligence

External research is required when it can materially affect architecture, package choice, implementation details, validation, integration, or product risk.

When applicable, agents should check current official documentation, public examples, popular open-source implementations, mature package options, and relevant ecosystem constraints. They must cite or summarize the sources used in reports and preserve the results under the planning module, preferably in `external_research.md` plus the relevant discovery, trace, evaluation, or integration report.

If external research is not applicable, unavailable, blocked by tool limits, or forbidden by the Run Mode Contract, the agent must record an explicit skip rationale. Do not invent third-party package APIs, versions, or capabilities.

## Operator run card

Before dispatching work and at phase boundaries, print:

```md
## ORC Status
- Run ID:
- Mode:
- Mutation policy:
- Phase:
- Planning module:
- Context packet:
- Resume state:
- Telemetry:
- Source edits allowed:
- Next gate:
```

## Verdict definitions

- `PASS`: all critical acceptance criteria are verified by direct evidence; required validation ran or has an explicit accepted waiver; no unauthorized mutations; no unresolved high-risk issues.
- `PARTIAL`: some criteria are verified, but non-critical evidence, tests, external research, or context is missing; no known critical failure.
- `FAIL`: any critical criterion is unmet, direct evidence contradicts the requirement, unauthorized mutation occurred, or required validation/research was skipped without acceptable rationale.
- `BLOCKED`: work cannot proceed without a user decision, missing prerequisite, unavailable tool, or unsafe mutation boundary.
- `WAIVED`: a user or approved policy explicitly accepts a missing validation or risk; waivers must be recorded in `decision_log.md`.

Evaluators must never mark `PASS` based only on another agent's report.

## Telemetry correlation and failure taxonomy

Every handoff and report should include `run_id`, `phase`, `mode`, `mutation_policy`, `planning_module`, and report path. Use these failure categories when applicable: `contract_violation`, `missing_context`, `missing_artifact`, `subagent_blocked`, `validation_failed`, `tool_error`, `compaction_loss`, `permission_violation`, `external_research_gap`, `user_decision_needed`, `telemetry_gap`.

## Taproot context packet

Every planning, implementation, evaluation, integration, and review handoff must include:

- The higher-level Taproot product goal.
- The current orchestration goal.
- How this task fits into the Taproot ecosystem.
- Relevant service boundaries and downstream consumers.
- Multi-cloud abstraction concerns.
- Auth and project-scoping concerns.
- Reliability, security, observability, evaluation, guardrail, prompt, retrieval, tool-hosting, worker, or frontend implications as relevant.
- The best product-aligned implementation standard.
- External docs, public baselines, package ecosystem findings, and explicit skip rationales where applicable.
- Known risks, unknowns, and tradeoffs.

## Durable context handoff

Discovery and tracing must become durable artifacts, not child-session-only analysis.

Preferred planning module layout:

```text
planning/<run-name>/
  context_packet.md
  resume_state.md
  task_plan.md
  findings.md
  progress.md
  decision_log.md
  risk_register.md
  validation_strategy.md
  external_research.md
  telemetry/
    run_manifest.md
    optimization_notes.md
  discovery_reports/
  trace_reports/
  implementation_reports/
  evaluation_reports/
  integration_report.md
```

Every downstream subagent must receive the context packet path, relevant raw report paths, and specific source files to verify. Every downstream subagent must report what context it consumed, what it independently verified, what it corrected, and what new context should be added to the packet.

Telemetry-enabled workflows should also preserve observable model/workflow behavior. The experimental plugin records visible reasoning parts, `task` tool handoff prompts, `subtask` parts if emitted by OpenCode, tool events, command events, compaction hooks when OpenCode calls them, and session/message events under `.opencode/telemetry/sessions/<session-id>/` by default. If `ORC_TELEMETRY_DIR` is set, it writes there instead.

Do not depend on hidden model internals. Use visible reasoning parts, subagent handoffs, tool traces, reports, and explicit rationale sections for optimization.

Critical planning artifacts must be read completely enough to reach EOF before they are treated as authoritative. Partial reads are acceptable only as an initial slice or when followed by targeted reads/searches that cover the relevant sections.

Every major decision should include a concise `Decision Rationale`. Every subagent report should include an `Execution Rationale` section describing why it inspected specific files, ran specific commands, skipped areas, and whether the handoff was clear.

If any downstream subagent finds stale, wrong, missing, or conflicting context, update `context_packet.md` before continuing the next wave.

## Parallel implementation waves

Parallel implementation is the default when safe. The orchestrator must produce an implementation wave manifest before dispatching or recommending workers.

Each wave manifest should include:

- Wave objective.
- Parallel group IDs.
- Task cards in each group.
- Expected files and shared resources each task may touch.
- Why same-group tasks are safe to run concurrently.
- Which tasks must run serially and why.

Same-group implementation tasks should be launched concurrently. Serial execution is only appropriate when tasks may touch the same file, generated artifact, migration, lockfile, config surface, or other shared mutation boundary.

Prefer decomposing work into independent vertical slices that preserve Taproot product coherence while allowing safe concurrency.

## Critical implementation mindset

Every agent and subagent should be critical of the proposed implementation. The goal is not to blindly satisfy a local task card; the goal is to produce the best implementation for Taproot's enterprise AI agent infrastructure platform.

When a requested path is too narrow, architecturally weak, product-misaligned, or likely to create downstream problems, surface the better path and explain the tradeoff. If a blocker, failure, or meaningful product decision appears, inform the user instead of hiding it inside the workflow.

## Integration and simplification pass

After implementation and initial verification, run a dedicated integration pass. Its purpose is to make the new work fit the existing codebase as if it had always belonged there.

The integration pass should remove unnecessary helpers, consolidate duplicate new logic, reuse existing shared utilities, research mature public package options before accepting bespoke low-level helpers, and align the implementation with existing service boundaries, domain language, provider abstractions, auth/project scoping, observability, and error-handling patterns.

The pass may perform targeted cleanup directly when it is clearly tied to the implementation. It should not execute a large architectural rewrite without approval, but it must surface large rewrite opportunities when they appear to be the best path for Taproot.
