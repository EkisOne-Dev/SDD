import { loadRoadmap, saveRoadmap, loadProgress, saveProgress, loadLastSession, saveSession, buildMentorContext, listRoadmaps, slugify } from './learner.js';
import { loadAgent, runEngine } from '../../orchestrator/orchestrator.js';
import readline from 'readline';

function prompt(rl, q) {
  return new Promise(resolve => rl.question(q, resolve));
}

async function generateRoadmap(topic, adapter) {
  console.log(`\n📚 No roadmap found for "${topic}". Generating one...\n`);
  const p = `You are a curriculum designer. Return ONLY a JSON object with this exact shape, no markdown, no explanation:
{"topic":"${topic}","topics":["topic1","topic2","topic3","topic4","topic5","topic6","topic7","topic8"]}
The topics array must have 6-10 items representing a logical learning progression for: ${topic}`;
  const result = await runEngine(p, adapter);
  const raw = result.replace(/```json|```/g, '').trim();
  try {
    const roadmap = JSON.parse(raw);
    if (!roadmap.topics || !Array.isArray(roadmap.topics)) throw new Error('bad shape');
    return roadmap;
  } catch {
    console.log('⚠️  Roadmap generation failed — using default structure');
    return { topic, topics: ['Fundamentals', 'Core concepts', 'Practical application', 'Advanced topics', 'Real-world projects', 'Job readiness'] };
  }
}

export async function runLearnCommand(topic, adapter) {
  if (!topic) {
    const roadmaps = listRoadmaps();
    if (!roadmaps.length) {
      console.log('\n📚 No active roadmaps. Start one with: sdd learn "topic"\n');
      return;
    }
    console.log('\n📚 Active Roadmaps\n');
    roadmaps.forEach(r => {
      const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
      console.log(`  ${r.slug.padEnd(30)} ${r.done}/${r.total} topics  (${pct}%)`);
    });
    console.log('\n  Resume with: sdd learn "<topic>"\n');
    return;
  }

  const slug = slugify(topic);
  let roadmap = loadRoadmap(slug);
  if (!roadmap) {
    roadmap = await generateRoadmap(topic, adapter);
    saveRoadmap(slug, roadmap);
    console.log(`✅ Roadmap saved: ${roadmap.topics.join(' → ')}\n`);
  }

  const progress = loadProgress(slug);
  const lastSession = loadLastSession(slug);

  if (progress.current_topic_index >= roadmap.topics.length) {
    console.log(`\n🎓 You have completed all topics in "${topic}"!\n`);
    console.log(`  Completed: ${progress.completed.join(', ')}\n`);
    return;
  }

  const mentorContext = buildMentorContext(topic, roadmap, progress, lastSession);
  const agent = loadAgent('mentor');
  const mentorPrompt = `${agent.identity}\n\n${agent.strategy}\n\nCONSTRAINTS: ${JSON.stringify(agent.constraints)}\n\n${mentorContext}`;

  console.log(`\n🎓 SDD Mentor — ${topic}`);
  console.log(`   Topic ${progress.current_topic_index + 1}/${roadmap.topics.length}: ${roadmap.topics[progress.current_topic_index]}\n`);

  let response;
  try {
    response = await runEngine(mentorPrompt, adapter);
  } catch (e) {
    if (e.status === 429 || (e.message && e.message.includes('429'))) {
      console.log('\n⚠️  API quota reached. Try again later or switch adapter to fallback.\n');
      console.log('  To switch: edit engine/adapter.json and set "active": "fallback"\n');
    } else {
      console.log('\n❌ Engine error:', e.message, '| status:', e.status, '| full:', JSON.stringify(e).slice(0,300));
    }
    return;
  }
  const artifact = response.includes('[ARTIFACT]')
    ? response.split('[ARTIFACT]')[1].split('[VERIFICATION]')[0].trim()
    : response;

  console.log('\n' + artifact + '\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt(rl, 'Your response (or "next" to advance, "quit" to exit): ');
  rl.close();

  const session = {
    timestamp: new Date().toISOString(),
    topic: roadmap.topics[progress.current_topic_index],
    last_question: artifact.split('\n').filter(Boolean).pop(),
    learner_response: answer.trim()
  };
  saveSession(slug, session);

  if (answer.trim().toLowerCase() === 'next') {
    progress.completed.push(roadmap.topics[progress.current_topic_index]);
    progress.current_topic_index++;
    saveProgress(slug, progress);
    console.log(`\n✅ Topic marked complete. Moving to: ${roadmap.topics[progress.current_topic_index] ?? 'Final review'}\n`);
  } else if (answer.trim().toLowerCase() !== 'quit') {
    console.log('\n📝 Response saved. Run sdd learn "' + topic + '" to continue.\n');
  }
}
