# OpenCode Orchestrated Coding Workflow

This package creates an opt-in, multi-agent OpenCode workflow for Taproot coding work.

It includes a real OpenCode skill plus companion agents, a command, and an optional telemetry plugin:

```text
commands/orc.md
agents/orchestrator.md
agents/wf-discover.md
agents/wf-trace.md
agents/wf-implement.md
agents/wf-evaluate.md
agents/wf-integrate.md
agents/wf-plan-evaluator.md
skills/orchestrated-workflow/SKILL.md
plugins/orc-telemetry.js
```

## Purpose

The workflow is designed for complex Taproot work where a single agent should not jump directly from requirement to implementation.

The orchestrator coordinates mode classification, discovery, logical tracing, external docs/baseline/package research, durable context handoff, detailed `planning-with-files` artifacts, implementation waves when approved, slice evaluation, codebase integration/simplification, focused final evaluation, and a final holistic review.

Every planning, implementation, evaluation, integration, and review handoff is expected to carry deep context about:

- Taproot's enterprise multi-cloud AI agent infrastructure goal.
- The current orchestration objective.
- The affected service and ecosystem boundaries.
- Auth, project scoping, reliability, security, observability, data contracts, and multi-cloud concerns.
- Current official docs, public examples, open-source baselines, and package ecosystem options when they materially affect the work.
- Why the local task matters to the broader Taproot platform.
- What the best product-aligned implementation looks like.

Agents are instructed to be critical of weak implementation paths and surface better product-aligned options when they see them.

## Optional Telemetry Plugin

This bundle includes an experimental local OpenCode plugin:

```text
plugins/orc-telemetry.js
```

The plugin records observable OpenCode workflow events so `/orc` behavior can be optimized from real runs.

It captures:

- Visible `reasoning` message parts when the provider exposes them.
- `task` tool calls, including subagent handoff prompts and child session IDs.
- `subtask` parts if the OpenCode runtime emits them.
- Tool parts and tool hook input/output snapshots.
- Compaction hook input/output snapshots when OpenCode calls plugin compaction hooks.
- `/orc` and other command execution events.
- Session, message, todo, and permission events.

It writes by default to:

```text
.opencode/telemetry/
  runs.jsonl
  session_edges.jsonl
  handoffs.jsonl
  failures.jsonl
  compactions.jsonl
  sessions/<session-id>/
    events.jsonl
    reasoning_parts.jsonl
    task_handoffs.jsonl
    subtask_handoffs.jsonl
    tool_parts.jsonl
    command_events.jsonl
    messages.jsonl
    sessions.jsonl
    todos.jsonl
    tool_hooks.jsonl
    compaction_hooks.jsonl
    reasoning_parts/*.md
    task_handoffs/*.md
    subtask_handoffs/*.md
```

Set `ORC_TELEMETRY_DIR` to write somewhere else.

By default, obvious secret-looking fields and secret-looking values are redacted, and long text is truncated. Set `ORC_TELEMETRY_REDACT=0` to disable redaction for local experiments. Set `ORC_TELEMETRY_RAW_TEXT=1` to capture full raw text snapshots.

This captures visible/provider-exposed reasoning only. It does not expose reasoning that the provider does not send to OpenCode.

## Mode-Aware Workflow

The workflow supports five run modes:

- `audit-roadmap`: Assess an existing implementation against a target and plan what remains. No source edits.
- `greenfield-plan`: Plan a new implementation from scratch. No source edits.
- `review-only`: Review code, a diff, latest commit, or planning artifacts. No source edits.
- `implementation-after-approval`: Discover, trace, and plan first, then ask before source edits.
- `implementation`: Discover, trace, plan, implement, evaluate, integrate, and review.

Every run gets a mutation policy:

- `read-only`: inspect and report only.
- `planning-artifacts-only`: write only inside the selected planning module.
- `source-editing-approved`: edit assigned source/test/config files according to task boundaries.

Every subagent receives the same Run Mode Contract so it does not independently reinterpret the user prompt:

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

For audit, greenfield planning, and review-only requests, `/orc` should stop after planning and holistic review, then summarize without dispatching implementation workers.

## Parallel Implementation Waves

Implementation is parallel by default when safe.

Before dispatching implementation workers, the orchestrator creates a wave manifest with explicit parallel groups. Same-group workers should be dispatched concurrently instead of one by one.

Parallel groups are safe when tasks touch different files, different service/module boundaries, or read-only/evaluation surfaces. Work must be serialized when tasks may touch the same file, generated artifact, migration, lockfile, config surface, or other shared mutation boundary.

If a wave has to run serially, the orchestrator must explain why parallelism was unsafe.

## Durable Context Handoff

Discovery and tracing are required to become durable planning artifacts. They should not remain trapped in child-session context.

Each orchestration run should use a self-contained planning module/folder. Preferred layout:

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

The orchestrator must synthesize discovery reports, trace reports, clarifying answers, and verified source references into `context_packet.md` before implementation starts.

`resume_state.md` is the compaction and session-resume checkpoint. It records the selected mode, mutation policy, current phase, planning module, last completed step, exact next action, active wave or parallel group, dispatched reports, changed files, blockers, validation status, and artifact read completeness.

Telemetry-enabled runs should also create `telemetry/run_manifest.md` and `telemetry/optimization_notes.md` inside the planning module. These planning artifacts should link or refer to the raw plugin telemetry location when known.

Discovery and trace subagents normally return report content plus a suggested path. The orchestrator preserves those reports under the planning module. If a discovery or trace subagent is explicitly asked to write a report, it may write only inside the selected planning module.

Every downstream subagent receives:

- Planning module path.
- `context_packet.md` path.
- `resume_state.md` path when present.
- Run ID and telemetry tags.
- Relevant discovery report paths.
- Relevant trace report paths.
- Relevant external research paths or explicit skip rationale.
- Specific source files to independently verify.

Every downstream subagent must report:

- What context it consumed.
- What claims it independently verified.
- What claims it corrected.
- What claims it could not verify.
- What new context should be added to the packet.
- Any stale assumptions or conflicts.

If a downstream subagent finds important missing, wrong, stale, or conflicting context, the orchestrator updates `context_packet.md` before continuing the next wave.

## Compaction And Resume Safety

OpenCode can compact long sessions. Compaction is model-generated and may be lossy, so the workflow treats the planning module as the source of truth.

`planning/orc_resume_index.md` is the fixed recovery pointer when the active planning module is unknown or context may have been compacted away.

When continuing after compaction, after a long pause, or from an existing planning module, the orchestrator should first read `resume_state.md`, `progress.md`, `task_plan.md`, `context_packet.md`, current phase reports, and relevant validation/external-research artifacts through EOF. A read such as `offset=1, limit=200` only reads the first 200 lines unless the tool output confirms end of file.

The workflow updates `resume_state.md` at phase boundaries, before user decisions, after each implementation wave, after evaluation, after integration, and before final summary. The telemetry plugin also records compaction hook calls to `compaction_hooks.jsonl` when OpenCode invokes those plugin hooks.

## External Research Requirement

External research is required when it can materially affect architecture, package choice, implementation details, validation, integration, or product risk.

When applicable, discovery and tracing check current official docs, public examples, popular open-source implementations, mature package options, and dependency ecosystem constraints. Implementation and evaluation verify core library, framework, service, provider, or package behavior against those sources. Integration researches public packages and mature baselines before accepting bespoke low-level helpers.

If external research is not applicable, unavailable, blocked, or forbidden by the run mode, the relevant agent records an explicit skip rationale in its report and, when useful, `external_research.md`.

## Planning requirement

This workflow intentionally uses `planning-with-files` by name.

The orchestrator must invoke `planning-with-files` after discovery, tracing, and any necessary clarification. It must instruct the planning skill to keep each orchestration run's planning artifacts in a new self-contained planning module/folder and never overwrite existing planning files.

The workflow follows the actual instructions loaded from `planning-with-files` for artifact creation and progress tracking.

Detailed planning artifacts are mode-specific.

For `audit-roadmap`, expected artifacts include:

- `current_state_assessment.md`
- `target_plan_coverage_matrix.md`
- `architecture_gap_analysis.md`
- `test_coverage_matrix.md`
- `target_completion_definition.md`
- `final_roadmap.md`

For `greenfield-plan`, expected artifacts include:

- `problem_statement.md`
- `requirements_and_non_goals.md`
- `domain_model.md`
- `architecture_options.md`
- `recommended_architecture.md`
- `api_and_contracts.md`
- `data_model_and_persistence.md`
- `auth_project_scoping_policy.md`
- `provider_abstraction_plan.md`
- `observability_and_events_plan.md`
- `implementation_wave_manifest.md`
- `rollout_and_migration_plan.md`

For implementation modes, expected artifacts include `implementation_wave_manifest.md` and `acceptance_criteria.md`.

`acceptance_criteria.md` should use this schema:

| ID | Source requirement | Behavior | Negative case | Evidence required | Validation command | Status | Residual risk |
|---|---|---|---|---|---|---|---|

Status values are `NOT_STARTED`, `IMPLEMENTED`, `VERIFIED`, `WAIVED`, or `BLOCKED`.

Evaluator verdicts are `PASS`, `PARTIAL`, `FAIL`, `BLOCKED`, or `WAIVED`. Evaluators must not mark `PASS` based only on another agent's report.

For telemetry-enabled runs, expected artifacts include `telemetry/run_manifest.md` and `telemetry/optimization_notes.md`.

## Important behavior

- `/orc` is opt-in.
- `opencode.json` does not set `orchestrator` as the default agent.
- Users can exit or bypass ORC in the same session by explicitly asking to stop/cancel/exit ORC, run something directly, skip the workflow, or not use `/orc`.
- Direct execution requests do not require `planning-with-files`, subagents, Operator Run Card, acceptance criteria, integration, or holistic review.
- Clarifying questions are conditional, not mandatory.
- The orchestrator and subagents have broad tool access by default.
- Scope discipline is prompt-driven, not permission-enforced.
- Subagents follow the orchestrator's Run Mode Contract and mutation policy instead of independently interpreting intent.
- Subagents include an `Execution Rationale` section to make workflow optimization easier.
- Discovery, trace, evaluation, and holistic review are read-only by default.
- Implementation workers are not dispatched unless the selected mode allows source edits.
- If blockers, failures, or product tradeoffs appear, the orchestrator should inform the user clearly so the user can decide.
- After implementation and initial verification, `wf-integrate` should make the new work fit existing codebase standards and surface any large rewrite opportunities.
- Applicable external docs, public baselines, and package due diligence must be completed or explicitly skipped with rationale.
- Compaction/session resume must use durable planning artifacts, not model memory.
- Every run should carry a stable run ID and print an Operator Run Card before dispatch and at phase boundaries.
- `planning/orc_resume_index.md` should point to the active run and next action for recovery.
- Prompt-level safety still requires confirmation or a stop before destructive commands, production deployments, migrations, secret exposure, or materially ambiguous targets.

## Install As Project-Local Workflow

Clone this package and copy the bundle directories into the target repo's `.opencode/` directory.

```powershell
New-Item -ItemType Directory -Force -Path "C:\path\to\your\repo\.opencode"
Copy-Item -Recurse -Force .\agents "C:\path\to\your\repo\.opencode\agents"
Copy-Item -Recurse -Force .\commands "C:\path\to\your\repo\.opencode\commands"
Copy-Item -Recurse -Force .\skills "C:\path\to\your\repo\.opencode\skills"
Copy-Item -Recurse -Force .\plugins "C:\path\to\your\repo\.opencode\plugins"
```

If your repo already has an `opencode.json`, do not blindly overwrite it. This package does not need to set `default_agent`; merge only fields you explicitly want. Skip copying `plugins` if you do not want local telemetry.

## Install As Global Workflow

Copy the companion files into the global OpenCode config directory:

```text
~/.config/opencode/skills/orchestrated-workflow/SKILL.md
~/.config/opencode/agents/orchestrator.md
~/.config/opencode/agents/wf-discover.md
~/.config/opencode/agents/wf-trace.md
~/.config/opencode/agents/wf-implement.md
~/.config/opencode/agents/wf-evaluate.md
~/.config/opencode/agents/wf-integrate.md
~/.config/opencode/agents/wf-plan-evaluator.md
~/.config/opencode/commands/orc.md
~/.config/opencode/plugins/orc-telemetry.js   # only if you want telemetry enabled globally
```

Restart OpenCode after installing or editing these files.

Prefer testing in a project-local `.opencode/` directory before replacing your global workflow. Skip copying `plugins/orc-telemetry.js` if you do not want telemetry enabled globally.

## Usage

Inside OpenCode, run:

```text
/orc Fix the SSE stream so tool events show up correctly and verify tool_config mode ANY is being applied
```

Or replace the requirement with any substantial Taproot coding work.

## Expected Sequence

1. Generate or resume a stable run ID, classify mode, and choose mutation policy.
2. Create or use a new self-contained planning module/folder for the run and update `planning/orc_resume_index.md`.
3. Print the Operator Run Card. If resuming, read checkpoint-critical planning artifacts through EOF before deciding the next action.
4. Dispatch discovery subagents with Run Mode Contracts.
5. Dispatch logical tracing subagents with Run Mode Contracts.
6. Preserve applicable external docs, public baseline, open-source, and package ecosystem research under the planning module.
7. Ask clarifying questions only when they materially change the work.
8. Invoke `planning-with-files`.
9. Follow the actual planning skill instructions and produce mode-specific planning artifacts.
10. For audit, greenfield, or review-only modes, dispatch holistic review and stop without implementation.
11. For implementation-after-approval, ask before source edits.
12. For approved implementation, plan implementation waves with explicit parallel groups and serial-work rationale where needed.
13. Dispatch same-group implementation workers concurrently with deep Taproot context packets.
14. Track progress using `planning-with-files` instructions and update `resume_state.md` at phase boundaries.
15. Dispatch evaluator workers with the Run Mode Contract, context packet, and acceptance criteria. Require independent verification.
16. Dispatch `wf-integrate` only after source edits and require package/baseline due diligence before accepting bespoke helpers.
17. If integration changes files or context, update `context_packet.md` and dispatch focused final evaluator workers.
18. Dispatch one holistic plan evaluator to assess mode fit, planning quality, context handoff quality, external research quality, resume-state quality, and final result.
19. Summarize final status, selected mode, planning artifacts, telemetry status, external research status, resume-state status, context handoff quality, integration status, verdict quality, large rewrite opportunities, remaining risks, and user decision points.
