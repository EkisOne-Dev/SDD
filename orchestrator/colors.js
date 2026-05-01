// ── ANSI color utility — single source of truth for all terminal colors ───────
// Standard #1: SRP — this file owns color output only
// Standard #7: imported once, reused everywhere

const R = '\x1b[0m';       // reset
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

export const c = {
  // Text colors
  green:   text => `\x1b[32m${text}${R}`,
  cyan:    text => `\x1b[36m${text}${R}`,
  yellow:  text => `\x1b[33m${text}${R}`,
  red:     text => `\x1b[31m${text}${R}`,
  magenta: text => `\x1b[35m${text}${R}`,
  dim:     text => `${DIM}${text}${R}`,
  bold:    text => `${BOLD}${text}${R}`,

  // Semantic aliases — use these in code, not raw colors
  result:   text => `${BOLD}\x1b[32m${text}${R}`,   // bold green — final output header
  status:   text => `\x1b[36m${text}${R}`,           // cyan — chain/agent status
  metric:   text => `\x1b[33m${text}${R}`,           // yellow — scores and metrics
  warning:  text => `\x1b[31m${text}${R}`,           // red — drift and errors
  skill:    text => `\x1b[35m${text}${R}`,           // magenta — skill routing
  cost:     text => `${DIM}${text}${R}`,             // dim — cost panel (low priority)
  error:    text => `${BOLD}\x1b[31m${text}${R}`,   // bold red — critical errors
};
