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

  for (const skill of registry.skills) {
    if (!skill.enabled) continue;
    if (skill.triggers.some(trigger => t.includes(trigger))) {
      return skill;
    }
  }

  return null;
}
