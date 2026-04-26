import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { applyProposal } from './applier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROPOSALS_DIR = path.join(__dirname, '../../meta/proposals');

function getPendingProposals() {
  if (!fs.existsSync(PROPOSALS_DIR)) return [];
  return fs.readdirSync(PROPOSALS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(PROPOSALS_DIR, f), 'utf8'));
      } catch { return null; }
    })
    .filter(p => {
      if (!p || p.status !== 'pending') return false;
      if (p.snoozed_until && new Date(p.snoozed_until) > new Date()) return false;
      return true;
    });
}

function saveProposal(proposal) {
  fs.writeFileSync(
    path.join(PROPOSALS_DIR, `${proposal.id}.json`),
    JSON.stringify(proposal, null, 2)
  );
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim().toUpperCase()); }));
}

async function runProposalManager() {
  const proposals = getPendingProposals();
  if (proposals.length === 0) return;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 IMPROVEMENT PROPOSAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const proposal of proposals) {
    console.log(`\n📊 Observed:    ${proposal.observed}`);
    console.log(`⚠️  Issue:       ${proposal.issue}`);
    console.log(`🔧 Suggestion:  ${proposal.suggestion}`);
    console.log('\n  Y = Apply this improvement automatically');
    console.log('  N = Reject permanently');
    console.log('  S = Snooze for ~5 days');
    console.log('  D = Dismiss permanently\n');

    const answer = await prompt('Your decision [Y/N/S/D]: ');

    if (answer === 'Y') {
      console.log('\n⚙️  Applying improvement...');
      const result = applyProposal(proposal);
      if (result.success) {
        proposal.status = 'accepted';
        proposal.resolved = new Date().toISOString();
        proposal.commit = result.commit;
        saveProposal(proposal);
        console.log(`✅ Applied: ${result.description}`);
        console.log(`📦 Committed as: ${result.commit}`);
        console.log('💾 Logged to meta/logs/self-improvements.jsonl\n');
      } else {
        console.log(`❌ Apply failed: ${result.message}\n`);
      }
    } else if (answer === 'N' || answer === 'D') {
      proposal.status = 'dismissed';
      proposal.resolved = new Date().toISOString();
      saveProposal(proposal);
      console.log('🚫 Dismissed.\n');
    } else if (answer === 'S') {
      proposal.snoozed_until = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      saveProposal(proposal);
      console.log('⏸️  Snoozed for ~5 days.\n');
    } else {
      console.log('⚠️  No valid input — skipping.\n');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

export { runProposalManager };
