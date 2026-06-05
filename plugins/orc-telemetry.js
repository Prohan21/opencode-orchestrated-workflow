import fs from "node:fs"
import path from "node:path"

const TELEMETRY_VERSION = 1
const REDACTED = "[REDACTED]"
const SENSITIVE_KEY_RE = /(api[_-]?key|authorization|bearer|cookie|credential|encrypted[_-]?content|password|passwd|secret|token)/i

function now() {
  return new Date().toISOString()
}

function safeName(value) {
  return String(value || "unknown")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120)
}

function pathValue(value) {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value.path === "string") return value.path
  if (typeof value.root === "string") return value.root
  if (typeof value.cwd === "string") return value.cwd
  if (typeof value.directory === "string") return value.directory
  return ""
}

function telemetryRoot(ctx) {
  if (process.env.ORC_TELEMETRY_DIR) {
    return path.resolve(process.env.ORC_TELEMETRY_DIR)
  }

  const base = pathValue(ctx.worktree) || pathValue(ctx.directory) || process.cwd()
  return path.join(base, ".opencode", "telemetry")
}

function shouldRedact() {
  return process.env.ORC_TELEMETRY_REDACT !== "0"
}

function cloneForLog(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value
  if (typeof value !== "object") return value
  if (depth > 12) return "[MaxDepth]"
  if (seen.has(value)) return "[Circular]"

  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => cloneForLog(item, depth + 1, seen))
  }

  const result = {}
  for (const [key, item] of Object.entries(value)) {
    if (shouldRedact() && SENSITIVE_KEY_RE.test(key)) {
      result[key] = REDACTED
      continue
    }
    result[key] = cloneForLog(item, depth + 1, seen)
  }
  return result
}

function appendJsonl(filePath, record) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8")
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, "utf8")
}

function payloadFromEvent(input) {
  const raw = input?.event || input
  return raw?.payload || raw
}

function eventDirectory(ctx, input) {
  const raw = input?.event || input
  return raw?.directory || ctx.directory || process.cwd()
}

function sessionIDFromPayload(payload) {
  const props = payload?.properties || {}
  return (
    props.sessionID ||
    props.part?.sessionID ||
    props.info?.sessionID ||
    props.info?.id ||
    props.message?.sessionID ||
    props.permission?.sessionID ||
    props.session?.id ||
    "unknown"
  )
}

function messageIDFromPayload(payload) {
  const props = payload?.properties || {}
  return props.messageID || props.part?.messageID || props.info?.id || props.permission?.messageID || "unknown"
}

function sessionDir(root, sessionID) {
  return path.join(root, "sessions", safeName(sessionID))
}

function baseRecord(ctx, input, category) {
  const payload = payloadFromEvent(input)
  const sessionID = sessionIDFromPayload(payload)
  return {
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: now(),
    category,
    directory: eventDirectory(ctx, input),
    sessionID,
    eventType: payload?.type || "unknown",
    payload: cloneForLog(payload),
  }
}

function recordEvent(ctx, root, input) {
  const payload = payloadFromEvent(input)
  if (!payload?.type) return

  const sessionID = sessionIDFromPayload(payload)
  const dir = sessionDir(root, sessionID)
  const record = baseRecord(ctx, input, "event")

  appendJsonl(path.join(dir, "events.jsonl"), record)

  const props = payload.properties || {}
  const part = props.part

  if (payload.type === "command.executed") {
    appendJsonl(path.join(dir, "command_events.jsonl"), record)
  }

  if (payload.type === "message.updated") {
    appendJsonl(path.join(dir, "messages.jsonl"), record)
  }

  if (payload.type.startsWith("session.")) {
    appendJsonl(path.join(dir, "sessions.jsonl"), record)
  }

  if (payload.type === "todo.updated") {
    appendJsonl(path.join(dir, "todos.jsonl"), record)
  }

  if (payload.type !== "message.part.updated" || !part) return

  appendJsonl(path.join(dir, "message_parts.jsonl"), record)

  if (part.type === "reasoning") {
    appendJsonl(path.join(dir, "reasoning_parts.jsonl"), record)
    writeReasoningSnapshot(dir, part)
  }

  if (part.type === "subtask") {
    appendJsonl(path.join(dir, "subtask_handoffs.jsonl"), record)
    writeSubtaskSnapshot(dir, part)
  }

  if (part.type === "tool") {
    appendJsonl(path.join(dir, "tool_parts.jsonl"), record)

    if (part.tool === "task" && part.state?.input?.prompt) {
      appendJsonl(path.join(dir, "task_handoffs.jsonl"), record)
      writeTaskHandoffSnapshot(dir, part)
    }
  }
}

function writeReasoningSnapshot(dir, part) {
  const file = path.join(
    dir,
    "reasoning_parts",
    `${safeName(part.messageID)}_${safeName(part.id)}.md`,
  )
  writeText(file, part.text || "")
}

function writeSubtaskSnapshot(dir, part) {
  const file = path.join(
    dir,
    "subtask_handoffs",
    `${safeName(part.messageID)}_${safeName(part.id)}_${safeName(part.agent)}.md`,
  )
  const content = [
    "# Subtask Handoff",
    "",
    `- Agent: ${part.agent}`,
    `- Description: ${part.description}`,
    `- Session: ${part.sessionID}`,
    `- Message: ${part.messageID}`,
    `- Part: ${part.id}`,
    "",
    "## Prompt",
    "",
    part.prompt || "",
    "",
  ].join("\n")
  writeText(file, content)
}

function writeTaskHandoffSnapshot(dir, part) {
  const state = part.state || {}
  const input = state.input || {}
  const metadata = state.metadata || {}
  const status = state.status || "unknown"
  const file = path.join(
    dir,
    "task_handoffs",
    `${safeName(part.callID)}_${safeName(status)}_${safeName(input.subagent_type || state.title || input.description)}.md`,
  )
  const content = [
    "# Task Handoff",
    "",
    `- Status: ${status}`,
    `- Description: ${input.description || state.title || ""}`,
    `- Subagent type: ${input.subagent_type || ""}`,
    `- Parent session: ${metadata.parentSessionId || part.sessionID || ""}`,
    `- Child session: ${metadata.sessionId || ""}`,
    `- Call ID: ${part.callID || ""}`,
    "",
    "## Prompt",
    "",
    input.prompt || "",
    "",
  ].join("\n")
  writeText(file, content)
}

function recordToolHook(ctx, root, hookName, input, output) {
  const sessionID = input?.sessionID || input?.messageID || output?.sessionID || "unknown"
  const dir = sessionDir(root, sessionID)
  appendJsonl(path.join(dir, "tool_hooks.jsonl"), {
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: now(),
    category: hookName,
    directory: ctx.directory || process.cwd(),
    sessionID,
    input: cloneForLog(input),
    output: cloneForLog(output),
  })
}

function recordPluginError(root, error) {
  appendJsonl(path.join(root, "plugin_errors.jsonl"), {
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: now(),
    error: error?.stack || error?.message || String(error),
  })
}

export const OrcTelemetry = async (ctx) => {
  const root = telemetryRoot(ctx)

  appendJsonl(path.join(root, "plugin_start.jsonl"), {
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: now(),
    directory: ctx.directory || process.cwd(),
    worktree: ctx.worktree,
    project: cloneForLog(ctx.project),
    redactionEnabled: shouldRedact(),
  })

  return {
    event: async (input) => {
      try {
        recordEvent(ctx, root, input)
      } catch (error) {
        recordPluginError(root, error)
      }
    },
    "tool.execute.before": async (input, output) => {
      try {
        recordToolHook(ctx, root, "tool.execute.before", input, output)
      } catch (error) {
        recordPluginError(root, error)
      }
    },
    "tool.execute.after": async (input, output) => {
      try {
        recordToolHook(ctx, root, "tool.execute.after", input, output)
      } catch (error) {
        recordPluginError(root, error)
      }
    },
  }
}

export default OrcTelemetry
