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

## Core workflow

1. Intake the user's requirement, identify the higher-level Taproot product goal, classify the run mode, and set the mutation policy.
2. Create or select a self-contained planning module/folder for this run.
3. Dispatch discovery subagents with a Run Mode Contract.
4. Dispatch logical tracing subagents with a Run Mode Contract.
5. Preserve discovery and trace reports under the planning module.
6. Ask clarifying questions only when the answer materially changes source-editing mode, scope, architecture, risk, implementation boundaries, or validation.
7. Invoke `planning-with-files` as the planning authority.
8. Tell `planning-with-files` to create or use the selected planning module/folder, never overwrite existing planning files, and produce the detailed artifacts required for the selected mode.
9. Create or update `context_packet.md` from discovery, trace, clarifying answers, and verified source references.
10. For `audit-roadmap`, `greenfield-plan`, or `review-only`, dispatch holistic review of the assessment or plan, then stop and summarize without implementation.
11. For `implementation-after-approval`, summarize the plan, risks, waves, and decision points, then ask for approval before source edits.
12. For approved implementation, build implementation waves from the planning artifacts, with explicit parallel groups and serial-work rationale where needed.
13. Give every implementation worker the Run Mode Contract, context packet path, relevant raw report paths, and files to independently verify.
14. Dispatch all implementation workers in the same parallel group concurrently; do not serialize same-group work unless a conflict requires it.
15. Track progress only as `planning-with-files` instructs and update `context_packet.md` when later agents add or correct important context.
16. Dispatch slice evaluators with the Run Mode Contract and context packet. Require independent verification.
17. Dispatch one codebase integration/simplification pass only after source edits.
18. If integration changes files or context, update the packet and dispatch focused final evaluators.
19. Dispatch one holistic plan evaluator to assess mode fit, planning quality, context handoff quality, and final result.
20. Inform the user clearly when blockers, failures, large rewrite opportunities, or product tradeoffs require a decision.
21. Summarize final state, selected mode, planning artifacts, context handoff quality, integration status, evaluation verdict, large rewrite opportunities, remaining risks, and recommended next action.

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

Every subagent handoff must include a Run Mode Contract:

```md
## Run Mode Contract
- Mode: audit-roadmap | greenfield-plan | review-only | implementation-after-approval | implementation
- Phase: discovery | trace | planning | implementation | evaluation | integration | holistic-review
- Mutation policy: read-only | planning-artifacts-only | source-editing-approved
- Planning module: ...
- Context packet: ...
- Durable report path, if this task should write one: ...
- Stop condition: ...
```

Subagents must follow the contract rather than independently reinterpreting the user prompt.

## Detailed planning artifacts

All modes should maintain `context_packet.md`, `decision_log.md`, `risk_register.md`, and `validation_strategy.md`.

`audit-roadmap` should add `current_state_assessment.md`, `target_plan_coverage_matrix.md`, `architecture_gap_analysis.md`, `test_coverage_matrix.md`, `target_completion_definition.md`, and `final_roadmap.md`.

`greenfield-plan` should add `problem_statement.md`, `requirements_and_non_goals.md`, `domain_model.md`, `architecture_options.md`, `recommended_architecture.md`, `api_and_contracts.md`, `data_model_and_persistence.md`, `auth_project_scoping_policy.md`, `provider_abstraction_plan.md`, `observability_and_events_plan.md`, `implementation_wave_manifest.md`, and `rollout_and_migration_plan.md`.

`implementation` and approved `implementation-after-approval` should add `implementation_wave_manifest.md` and `acceptance_criteria.md`.

Planning is not complete until a new agent with no hidden context could execute or evaluate the next phase from the artifacts alone.

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
- Known risks, unknowns, and tradeoffs.

## Durable context handoff

Discovery and tracing must become durable artifacts, not child-session-only analysis.

Preferred planning module layout:

```text
planning/<run-name>/
  context_packet.md
  task_plan.md
  findings.md
  progress.md
  decision_log.md
  risk_register.md
  validation_strategy.md
  discovery_reports/
  trace_reports/
  implementation_reports/
  evaluation_reports/
  integration_report.md
```

Every downstream subagent must receive the context packet path, relevant raw report paths, and specific source files to verify. Every downstream subagent must report what context it consumed, what it independently verified, what it corrected, and what new context should be added to the packet.

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

The integration pass should remove unnecessary helpers, consolidate duplicate new logic, reuse existing shared utilities, and align the implementation with existing service boundaries, domain language, provider abstractions, auth/project scoping, observability, and error-handling patterns.

The pass may perform targeted cleanup directly when it is clearly tied to the implementation. It should not execute a large architectural rewrite without approval, but it must surface large rewrite opportunities when they appear to be the best path for Taproot.
