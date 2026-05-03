import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Module-level cache — read once, reuse every call (Standard #7) ───────────
let _registryCache = null;

function loadRegistry() {
  if (_registryCache) return _registryCache;
  try {
    _registryCache = JSON.parse(readFileSync(join(__dirname, "registry.json"), "utf8"));
    return _registryCache;
  } catch {
    return null;
  }
}

export function routeSkill(task) {
  const registry = loadRegistry();
  if (!registry) return null;

  const t = task.toLowerCase();
  let bestSkill = null;
  let bestScore = 0;

  for (const skill of registry.skills) {
    if (!skill.enabled) continue;
    const score = skill.triggers.filter(trigger => t.includes(trigger)).length;
    if (score > bestScore) {
      bestScore = score;
      bestSkill = skill;
    }
  }

  return bestSkill;
}
