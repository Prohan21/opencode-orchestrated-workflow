# opencode-orchestrated-workflow

An opencode `/orc` workflow for delegated multi-agent coding runs.

The workflow uses an orchestrator agent to classify work, create durable planning context, dispatch discovery and tracing agents, coordinate implementation waves, run evaluation, and finish with an integration/simplification pass.

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
```

## Install

Copy the folders into your global opencode config directory:

```powershell
Copy-Item -Recurse -Force .\agents "$env:USERPROFILE\.config\opencode\agents"
Copy-Item -Recurse -Force .\commands "$env:USERPROFILE\.config\opencode\commands"
Copy-Item -Recurse -Force .\skills "$env:USERPROFILE\.config\opencode\skills"
```

Restart opencode after installing. Config-time files are loaded at startup and are not hot-reloaded.

## Usage

```text
/orc <requirement>
```

Use `/orc` for complex coding work that benefits from discovery, planning artifacts, explicit implementation waves, independent evaluation, and a final codebase integration pass.

## Notes

This workflow expects the `planning-with-files` skill to be available when durable planning artifacts are needed.
