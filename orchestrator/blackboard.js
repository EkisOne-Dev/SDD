// orchestrator/blackboard.js — Blackboard Public API (Phase 57B)
// Thin async init wrapper over memory/blackboard-db.js (synchronous queries).
// All callers must await initBlackboard() once before any write/read call.
// Two DB lifecycle rule:
//   memory.db  — permanent, never VACUUM mid-session
//   blackboard.db — ephemeral, VACUUM after every bbCleanupSession()
import {
  getBB,
  bbInsertTask,
  bbUpdateTaskStatus,
  bbInsertSolution,
  bbUpsertContext,
  bbInsertInteraction,
  bbGetTasks,
  bbGetSolutions,
  bbGetContext,
  bbGetInteractions,
  bbCleanupSession,
  bbClose
} from '../memory/blackboard-db.js';

let _ready = false;

// Must be called once per session before any other blackboard function.
export async function initBlackboard(dbPath) {
  if (_ready) return;
  await getBB(dbPath);
  _ready = true;
}

// ── Write API ─────────────────────────────────────────────────────────────────

export function writePipelineTask(session_id, task_slug, agent = null) {
  bbInsertTask(session_id, task_slug, agent);
}

export function updateTaskStatus(session_id, task_slug, status) {
  bbUpdateTaskStatus(session_id, task_slug, status);
}

export function writeTaskSolution(session_id, task_slug, agent, solution, score = 0) {
  bbInsertSolution(session_id, task_slug, agent, solution, score);
}

export function writeSessionContext(session_id, context) {
  bbUpsertContext(session_id, context);
}

export function writeInteraction(session_id, role, content, agent = null) {
  bbInsertInteraction(session_id, role, content, agent);
}

// ── Read API ──────────────────────────────────────────────────────────────────

export function getPipelineTasks(session_id) {
  return bbGetTasks(session_id);
}

export function getTaskSolutions(session_id, task_slug) {
  return bbGetSolutions(session_id, task_slug);
}

export function getSessionContext(session_id) {
  return bbGetContext(session_id);
}

export function getInteractionHistory(session_id, limit = 20) {
  return bbGetInteractions(session_id, limit);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

// Deletes all rows for session_id then VACUUMs — call at session-end.
export function vacuumBlackboard(session_id) {
  bbCleanupSession(session_id);
}

export function closeBlackboard() {
  bbClose();
  _ready = false;
}
