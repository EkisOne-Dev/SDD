import { readFileSync, existsSync } from "fs";
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

function loadSkillContent(skill) {
  if (!skill.library_file) return null;
  try {
    const filePath = join(__dirname, skill.library_file);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
  } catch { return null; }
}


// Phase 47 — Alpha/Beta system-layer composition
function composeSkillBlock(skill, allSkills, sddRoot) {
  const lines = [];

  // Load Alpha skill content
  if (skill.library_file) {
    const alphaPath = join(sddRoot, skill.library_file);
    if (existsSync(alphaPath)) {
      lines.push(readFileSync(alphaPath, 'utf8').trim());
    }
  }

  // Load and append Beta sub-skill dependencies
  if (skill.dependencies && skill.dependencies.length > 0) {
    for (const depId of skill.dependencies) {
      const dep = allSkills.find(s => s.id === depId);
      if (dep && dep.library_file) {
        const betaPath = join(sddRoot, dep.library_file);
        if (existsSync(betaPath)) {
          lines.push('\n--- SUB-SKILL: ' + dep.name + ' ---');
          lines.push(readFileSync(betaPath, 'utf8').trim());
        }
      }
    }
  }

  return lines.join('\n');
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

  if (bestSkill) bestSkill.content = composeSkillBlock(bestSkill, registry.skills, join(__dirname, '..'));
  return bestSkill;
}
