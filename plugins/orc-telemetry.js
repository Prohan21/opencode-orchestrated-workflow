import fs from "node:fs"
import path from "node:path"

const TELEMETRY_VERSION = 1
const REDACTED = "[REDACTED]"
const SENSITIVE_KEY_RE = /(api[_-]?key|authorization|bearer|cookie|credential|encrypted[_-]?content|password|passwd|secret|token)/i
const MAX_TEXT_VALUE = Number.parseInt(process.env.ORC_TELEMETRY_MAX_TEXT || "12000", 10)
const MAX_SNAPSHOT_TEXT = Number.parseInt(process.env.ORC_TELEMETRY_MAX_SNAPSHOT || "20000", 10)
const SECRET_VALUE_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bASIA[0-9A-Z]{16}\b/g,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  /\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/gi,
  /(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi,
]
const FAILURE_CATEGORIES = new Set([
  "contract_violation",
  "missing_context",
  "missing_artifact",
  "subagent_blocked",
  "validation_failed",
  "tool_error",
  "compaction_loss",
  "permission_violation",
  "external_research_gap",
  "user_decision_needed",
  "telemetry_gap",
])

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

function allowRawTextCapture() {
  return process.env.ORC_TELEMETRY_RAW_TEXT === "1"
}

function truncateText(value, maxLength = MAX_TEXT_VALUE) {
  const text = String(value)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}\n[TRUNCATED ${text.length - maxLength} chars]`
}

function redactString(value) {
  let text = String(value)
  if (!shouldRedact()) return truncateText(text)
  for (const pattern of SECRET_VALUE_PATTERNS) {
    text = text.replace(pattern, REDACTED)
  }
  return truncateText(text)
}

function cloneForLog(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value
  if (typeof value === "string") return redactString(value)
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

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim().replace(/[`,]$/g, "")
  }
  return ""
}

function workflowFromText(value) {
  const text = String(value || "")
  if (!text) return {}
  const runID = firstMatch(text, [
    /(?:^|\n)\s*(?:[-*]\s*)?(?:Run ID|run_id)\s*:\s*([^\n;]+)/i,
    /run_id=([^;\n]+)/i,
  ])
  const phase = firstMatch(text, [
    /(?:^|\n)\s*(?:[-*]\s*)?Phase\s*:\s*([^\n;]+)/i,
    /phase=([^;\n]+)/i,
  ])
  const mode = firstMatch(text, [
    /(?:^|\n)\s*(?:[-*]\s*)?Mode\s*:\s*([^\n;]+)/i,
    /mode=([^;\n]+)/i,
  ])
  const mutationPolicy = firstMatch(text, [
    /(?:^|\n)\s*(?:[-*]\s*)?Mutation policy\s*:\s*([^\n;]+)/i,
    /mutation_policy=([^;\n]+)/i,
  ])
  const planningModule = firstMatch(text, [
    /(?:^|\n)\s*(?:[-*]\s*)?Planning module\s*:\s*([^\n;]+)/i,
    /planning_module=([^;\n]+)/i,
  ])
  return { runID, phase, mode, mutationPolicy, planningModule }
}

function mergeWorkflow(...items) {
  const result = {}
  for (const item of items) {
    for (const [key, value] of Object.entries(item || {})) {
      if (value && !result[key]) result[key] = value
    }
  }
  return result
}

function workflowFromPayload(payload) {
  const props = payload?.properties || {}
  const part = props.part || {}
  const state = part.state || {}
  const input = state.input || {}
  return mergeWorkflow(
    {
      runID: process.env.ORC_RUN_ID || props.runID || props.runId || props.run_id || input.runID || input.run_id,
      phase: props.phase || input.phase,
      mode: props.mode || input.mode,
      mutationPolicy: props.mutationPolicy || props.mutation_policy || input.mutationPolicy || input.mutation_policy,
      planningModule: props.planningModule || props.planning_module || input.planningModule || input.planning_module,
    },
    workflowFromText(input.prompt),
    workflowFromText(part.prompt),
    workflowFromText(props.message?.content),
  )
}

function workflowFromHook(input, output) {
  return mergeWorkflow(
    {
      runID: process.env.ORC_RUN_ID || input?.runID || input?.runId || input?.run_id || output?.runID || output?.run_id,
      phase: input?.phase || output?.phase,
      mode: input?.mode || output?.mode,
      mutationPolicy: input?.mutationPolicy || input?.mutation_policy || output?.mutationPolicy || output?.mutation_policy,
      planningModule: input?.planningModule || input?.planning_module || output?.planningModule || output?.planning_module,
    },
    workflowFromText(input?.prompt),
    workflowFromText(input?.args?.prompt),
    workflowFromText(output?.prompt),
  )
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

function sessionDir(root, sessionID) {
  return path.join(root, "sessions", safeName(sessionID))
}

function baseRecord(ctx, input, category) {
  const payload = payloadFromEvent(input)
  const sessionID = sessionIDFromPayload(payload)
  const workflow = workflowFromPayload(payload)
  return {
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: now(),
    category,
    directory: eventDirectory(ctx, input),
    sessionID,
    workflow,
    eventType: payload?.type || "unknown",
    payload: cloneForLog(payload),
  }
}

function compactWorkflow(record) {
  return {
    runID: record?.workflow?.runID || "unknown",
    phase: record?.workflow?.phase || "unknown",
    mode: record?.workflow?.mode || "unknown",
    mutationPolicy: record?.workflow?.mutationPolicy || "unknown",
    planningModule: record?.workflow?.planningModule || "unknown",
  }
}

function appendRootIndex(root, filename, record) {
  appendJsonl(path.join(root, filename), record)
}

function failureCategoryFromText(value) {
  const text = String(value || "")
  for (const category of FAILURE_CATEGORIES) {
    if (text.includes(category)) return category
  }
  return ""
}

function statusFromPart(part) {
  return part?.state?.status || part?.status || "unknown"
}

function recordEvent(ctx, root, input) {
  const payload = payloadFromEvent(input)
  if (!payload?.type) return

  const sessionID = sessionIDFromPayload(payload)
  const dir = sessionDir(root, sessionID)
  const record = baseRecord(ctx, input, "event")

  appendJsonl(path.join(dir, "events.jsonl"), record)

  if (payload.type === "command.executed") {
    appendRootIndex(root, "runs.jsonl", {
      ...compactWorkflow(record),
      telemetryVersion: TELEMETRY_VERSION,
      timestamp: record.timestamp,
      eventType: payload.type,
      sessionID,
      directory: record.directory,
      status: "command_executed",
    })
  }

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
      recordTaskHandoffIndex(root, record, part)
      writeTaskHandoffSnapshot(dir, part)
    }
  }
}

function recordTaskHandoffIndex(root, record, part) {
  const state = part.state || {}
  const input = state.input || {}
  const metadata = state.metadata || {}
  const status = statusFromPart(part)
  const edge = {
    ...compactWorkflow(record),
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: record.timestamp,
    parentSessionID: metadata.parentSessionId || part.sessionID || record.sessionID || "unknown",
    childSessionID: metadata.sessionId || "unknown",
    callID: part.callID || "unknown",
    subagentType: input.subagent_type || "unknown",
    description: redactString(input.description || state.title || ""),
    status,
  }
  appendRootIndex(root, "session_edges.jsonl", edge)
  appendRootIndex(root, "handoffs.jsonl", edge)
  if (["error", "failed", "blocked"].includes(String(status).toLowerCase())) {
    appendRootIndex(root, "failures.jsonl", {
      ...edge,
      failureCategory: failureCategoryFromText(input.prompt) || "subagent_blocked",
    })
  }
}

function writeReasoningSnapshot(dir, part) {
  const file = path.join(
    dir,
    "reasoning_parts",
    `${safeName(part.messageID)}_${safeName(part.id)}.md`,
  )
  writeText(file, snapshotText(part.text || ""))
}

function snapshotText(value) {
  const text = allowRawTextCapture() ? String(value || "") : truncateText(String(value || ""), MAX_SNAPSHOT_TEXT)
  return shouldRedact() ? redactString(text) : truncateText(text, MAX_SNAPSHOT_TEXT)
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
    snapshotText(part.prompt || ""),
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
    snapshotText(input.prompt || ""),
    "",
  ].join("\n")
  writeText(file, content)
}

function recordToolHook(ctx, root, hookName, input, output) {
  const sessionID = input?.sessionID || input?.messageID || output?.sessionID || "unknown"
  const workflow = workflowFromHook(input, output)
  const dir = sessionDir(root, sessionID)
  const record = {
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: now(),
    category: hookName,
    directory: ctx.directory || process.cwd(),
    sessionID,
    workflow,
    input: cloneForLog(input),
    output: cloneForLog(output),
  }
  appendJsonl(path.join(dir, "tool_hooks.jsonl"), record)
  if (output?.error || input?.error) {
    appendRootIndex(root, "failures.jsonl", {
      ...compactWorkflow(record),
      telemetryVersion: TELEMETRY_VERSION,
      timestamp: record.timestamp,
      sessionID,
      failureCategory: "tool_error",
      category: hookName,
      error: cloneForLog(output?.error || input?.error),
    })
  }
}

function recordCompactionHook(ctx, root, hookName, input, output) {
  const sessionID =
    input?.sessionID ||
    input?.session?.id ||
    input?.messageID ||
    output?.sessionID ||
    output?.session?.id ||
    "unknown"
  const dir = sessionDir(root, sessionID)
  const workflow = workflowFromHook(input, output)
  const record = {
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: now(),
    category: hookName,
    directory: ctx.directory || process.cwd(),
    sessionID,
    workflow,
    input: cloneForLog(input),
    output: cloneForLog(output),
  }
  appendJsonl(path.join(dir, "compaction_hooks.jsonl"), record)
  appendRootIndex(root, "compactions.jsonl", {
    ...compactWorkflow(record),
    telemetryVersion: TELEMETRY_VERSION,
    timestamp: record.timestamp,
    sessionID,
    category: hookName,
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
    rawTextCaptureEnabled: allowRawTextCapture(),
    telemetryRoot: root,
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
    "experimental.session.compacting": async (input, output) => {
      try {
        recordCompactionHook(ctx, root, "experimental.session.compacting", input, output)
      } catch (error) {
        recordPluginError(root, error)
      }
    },
    "experimental.compaction.autocontinue": async (input, output) => {
      try {
        recordCompactionHook(ctx, root, "experimental.compaction.autocontinue", input, output)
      } catch (error) {
        recordPluginError(root, error)
      }
    },
  }
}

export default OrcTelemetry
