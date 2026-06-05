# opencode-orchestrated-workflow

An opencode `/orc` workflow for delegated multi-agent coding runs.

The workflow uses an orchestrator agent to classify work, create durable planning context, dispatch discovery and tracing agents, coordinate implementation waves, run evaluation, and finish with an integration/simplification pass.

Optional telemetry support records observable opencode workflow events so `/orc` runs can be analyzed and improved without depending on hidden model internals.

## Contents

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

## Install

Copy the folders into your global opencode config directory:

```powershell
Copy-Item -Recurse -Force .\agents "$env:USERPROFILE\.config\opencode\agents"
Copy-Item -Recurse -Force .\commands "$env:USERPROFILE\.config\opencode\commands"
Copy-Item -Recurse -Force .\skills "$env:USERPROFILE\.config\opencode\skills"
Copy-Item -Recurse -Force .\plugins "$env:USERPROFILE\.config\opencode\plugins"
```

Restart opencode after installing. Config-time files are loaded at startup and are not hot-reloaded.

If you do not want local telemetry, skip the `plugins` copy command.

## Usage

```text
/orc <requirement>
```

Use `/orc` for complex coding work that benefits from discovery, planning artifacts, explicit implementation waves, independent evaluation, and a final codebase integration pass.

## Telemetry

`plugins/orc-telemetry.js` is an optional local opencode plugin. It captures observable workflow events from real `/orc` runs so the workflow can be optimized from evidence.

It records:

- Visible `reasoning` message parts when the provider exposes them.
- `task` tool calls, including subagent handoff prompts and child session IDs.
- `subtask` parts if the opencode runtime emits them.
- Tool parts and tool hook input/output snapshots.
- Command execution events.
- Session, message, todo, and permission events.

By default it writes to:

```text
.opencode/telemetry/sessions/<session-id>/
```

Set `ORC_TELEMETRY_DIR` to write somewhere else.

Obvious secret-looking fields are redacted by default. Set `ORC_TELEMETRY_REDACT=0` only for local experiments where raw values are safe to capture.

Telemetry-enabled runs also prompt the orchestrator to create planning artifacts:

```text
planning/<run-name>/telemetry/run_manifest.md
planning/<run-name>/telemetry/optimization_notes.md
```

Generated telemetry output is intentionally not part of this repository.

## Notes

This workflow expects the `planning-with-files` skill to be available when durable planning artifacts are needed.
