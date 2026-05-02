// ── Visual spinner — SRP: owns spinner display only ───────────────────────────
// Runs as a setInterval loop while runEngine() awaits. Clears cleanly on stop.

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const INTERVAL_MS = 80;

export function createSpinner(providerName) {
  let frame = 0;
  let interval = null;

  const label = providerName ? ` waiting for ${providerName}...` : ' thinking...';

  function start() {
    interval = setInterval(() => {
      const tick = FRAMES[frame % FRAMES.length];
      process.stdout.write(`\r\x1b[36m${tick}\x1b[0m${label}`);
      frame++;
    }, INTERVAL_MS);
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
      // Clear the spinner line completely
      process.stdout.write('\r\x1b[K');
    }
  }

  return { start, stop };
}
