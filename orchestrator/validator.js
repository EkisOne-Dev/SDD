import { existsSync } from 'fs';
import { join } from 'path';

const SYSTEM_REQUIRED = [
  'version', 'memory_file', 'default_agent', 'default_phase',
  'capability_check_enabled', 'negotiation_enabled', 'scoring_enabled',
  'cost_tracking_enabled', 'meta_observation_enabled',
  'self_research_enabled', 'self_research_mode'
];

const ADAPTER_REQUIRED_TOP = ['active'];
const ADAPTER_PRIMARY_REQUIRED = ['provider', 'model', 'api_key_env', 'base_url'];

function fail(filePath, message) {
  console.error(`\n❌ CONFIG ERROR — ${filePath}`);
  console.error(`   ${message}`);
  console.error(`   Fix this field and restart SDD.\n`);
  process.exit(1);
}

export function validateSystemConfig(config, filePath) {
  for (const field of SYSTEM_REQUIRED) {
    if (config[field] === undefined || config[field] === null || config[field] === '') {
      fail(filePath, `Missing or empty required field: "${field}"`);
    }
  }
  if (typeof config.capability_check_enabled !== 'boolean') {
    fail(filePath, `Field "capability_check_enabled" must be a boolean (true/false)`);
  }
  if (typeof config.scoring_enabled !== 'boolean') {
    fail(filePath, `Field "scoring_enabled" must be a boolean (true/false)`);
  }
  if (!['local', 'ai', 'web'].includes(config.self_research_mode)) {
    fail(filePath, `Field "self_research_mode" must be "local", "ai", or "web". Got: "${config.self_research_mode}"`);
  }
  if (!existsSync(join(process.env.HOME, 'sdd', config.memory_file))) {
    console.warn(`\n⚠️  Warning: memory_file "${config.memory_file}" does not exist yet — will be created on first task.\n`);
  }
}

export function validateAdapterConfig(adapter, filePath) {
  for (const field of ADAPTER_REQUIRED_TOP) {
    if (adapter[field] === undefined || adapter[field] === null) {
      fail(filePath, `Missing required top-level field: "${field}"`);
    }
  }
  const primary = adapter['primary'];
  if (!primary) {
    fail(filePath, `Missing required block: "primary"`);
  }
  for (const field of ADAPTER_PRIMARY_REQUIRED) {
    if (!primary[field]) {
      fail(filePath, `Missing required field in "primary": "${field}"`);
    }
  }
  const activeKey = adapter.active;
  if (!adapter[activeKey]) {
    fail(filePath, `"active" is set to "${activeKey}" but no such provider block exists in adapter.json`);
  }
}
