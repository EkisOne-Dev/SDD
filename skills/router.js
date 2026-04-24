import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function routeSkill(task) {
  const registryPath = join(__dirname, "registry.json");
  let registry;

  try {
    registry = JSON.parse(readFileSync(registryPath, "utf8"));
  } catch {
    return null;
  }

  const t = task.toLowerCase();

  for (const skill of registry.skills) {
    if (!skill.enabled) continue;
    if (skill.triggers.some(trigger => t.includes(trigger))) {
      return skill;
    }
  }

  return null;
}
