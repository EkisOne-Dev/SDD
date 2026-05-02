// ── SDD Code Quality Rules — machine-readable enforcement ────────────────────
// These are the 10 Code Quality Standards from SPEC.md, expressed as detectors.
// Used by the pre-commit hook to validate staged JS files before commit.

export const RULES = [
  {
    id: 'STD-3',
    name: 'No Dead Code Aliases',
    description: 'Alias assignments where both sides are identical add no value.',
    detect: content => {
      const matches = content.match(/const\s+(\w+)\s*=\s*(\w+)\s*;/g) || [];
      return matches.filter(m => {
        const parts = m.match(/const\s+(\w+)\s*=\s*(\w+)\s*;/);
        return parts && parts[1] !== parts[2] ? false :
          m.includes('finalPrompt = prompt') || m.includes('finalResult = result');
      });
    },
    message: 'Dead code alias detected (e.g. const finalPrompt = prompt). Remove it.'
  },
  {
    id: 'STD-8',
    name: 'Consistent Logging Contract',
    description: 'logExecution() must receive a string, never an object.',
    detect: content => {
      const matches = content.match(/logExecution\s*\(\s*\{/g) || [];
      return matches;
    },
    message: 'logExecution() called with an object — use a template literal string instead.'
  },
  {
    id: 'STD-4',
    name: 'No Variable Shadowing',
    description: 'Inner scope variables must not shadow outer scope variables.',
    detect: content => {
      // Detect: const agents = inside a block that already has agents as a param
      const matches = content.match(/for\s*\(.*\)\s*\{[\s\S]{0,200}const\s+agents\s*=/g) || [];
      return matches;
    },
    message: 'Variable shadowing detected — const agents = inside a loop that has agents in scope.'
  },
  {
    id: 'STD-7',
    name: 'I/O Caching',
    description: 'readFileSync inside an exported function without a module-level cache.',
    detect: content => {
      // Flag readFileSync inside export function bodies (not at module level)
      const matches = content.match(/export\s+(async\s+)?function\s+\w+[\s\S]{0,500}readFileSync/g) || [];
      return matches.filter(m => !content.includes('_cache') && !content.includes('Cache'));
    },
    message: 'readFileSync inside exported function — add a module-level cache (Standard #7).'
  }
];
