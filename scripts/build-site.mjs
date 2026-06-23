#!/usr/bin/env node
// Build the GitHub Pages data file for the Claude Code Plugin Marketplace.
// Reads .claude-plugin/marketplace.json + every plugin manifest, scans each
// plugin directory for commands/agents/skills/hooks/MCP servers, derives a
// curated category, and emits site/data/plugins.json consumed by the static
// site at runtime. The HTML/CSS/JS are static — only this data is generated,
// so the catalog never drifts from the manifest.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARKETPLACE = join(ROOT, '.claude-plugin', 'marketplace.json');
const OUT_DIR = join(ROOT, 'site', 'data');
const OUT_FILE = join(OUT_DIR, 'plugins.json');

/** Curated category + accent for each plugin (keyed by manifest name). */
const CATEGORY = {
  'aws-eks-helm-keycloak': 'Infrastructure & DevOps',
  'deployment-pipeline': 'Infrastructure & DevOps',
  'fullstack-iac': 'Infrastructure & DevOps',
  'tvs-microsoft-deploy': 'Microsoft & Enterprise',
  'lobbi-m365-automator': 'Microsoft & Enterprise',
  'dotnet-blazor': 'Backend & APIs',
  'fastapi-backend': 'Backend & APIs',
  'claude-code-expert': 'AI & Claude Code',
  'claude-code-templating': 'AI & Claude Code',
  'scrapin-aint-easy': 'AI & Claude Code',
  'upgrade-suggestion': 'AI & Claude Code',
  'work-automation': 'AI & Claude Code',
  'writing-plans-enhanced': 'AI & Claude Code',
  'frontend-design-system': 'Frontend & Design',
  'react-animation-studio': 'Frontend & Design',
  'mui-expert': 'Frontend & Design',
  'drawio-diagramming': 'Frontend & Design',
  'jira-orchestrator': 'Project Management',
  'linear-orchestrator': 'Project Management',
  'project-management-plugin': 'Project Management',
  'team-accelerator': 'Project Management',
  'exec-automator': 'Project Management',
  'lobbi-bi-reports': 'Lobbi Domain',
  'lobbi-compliance-guard': 'Lobbi Domain',
  'lobbi-data-migration': 'Lobbi Domain',
  'lobbi-document-intelligence': 'Lobbi Domain',
  'lobbi-engagement-toolkit': 'Lobbi Domain',
  'lobbi-insurance-domain': 'Lobbi Domain',
  'lobbi-mortgage-domain': 'Lobbi Domain',
  'lobbi-system-integrator': 'Lobbi Domain',
  'lobbi-workflow-engine': 'Lobbi Domain',
  'lobbi-platform-manager': 'Lobbi Domain',
  'home-assistant-architect': 'Backend & APIs',
  'cowork-marketplace': 'Marketplace & Platform',
  'marketplace-pro': 'Marketplace & Platform',
};

const SUBPLUGINS = [
  'api-integration-helper',
  'code-quality-orchestrator',
  'dev-environment-bootstrap',
  'langgraph-architect',
  'migration-wizard',
  'testforge',
];

/** Count *.md files directly inside a directory (non-recursive). */
function countMarkdown(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md' && f.toLowerCase() !== 'index.md').length;
}

/** Count skills: each subdirectory containing a SKILL.md. */
function countSkills(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory() && existsSync(join(full, 'SKILL.md'))) n++;
  }
  return n;
}

/** Count hook scripts (*.sh / *.mjs / *.js / *.py) in a hooks dir. */
function countHooks(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => /\.(sh|mjs|js|py|ts)$/.test(f)).length;
}

function detectMcp(manifest, pluginDir) {
  if (manifest.mcpServers && Object.keys(manifest.mcpServers).length) return true;
  if (manifest.mcp) return true;
  return existsSync(join(pluginDir, 'mcp')) || existsSync(join(pluginDir, 'mcp-server')) || existsSync(join(pluginDir, 'src', 'mcp'));
}

function scanPlugin(entry) {
  const pluginDir = join(ROOT, entry.source.replace(/^\.\//, ''));
  const manifestPath = join(pluginDir, '.claude-plugin', 'plugin.json');
  let manifest = {};
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      /* tolerate parse failures — fall back to marketplace entry */
    }
  }

  const commands = countMarkdown(join(pluginDir, 'commands'));
  const agents = countMarkdown(join(pluginDir, 'agents'));
  const skills = countSkills(join(pluginDir, 'skills'));
  const hooks = countHooks(join(pluginDir, 'hooks'));
  const mcp = detectMcp(manifest, pluginDir);
  const hasReadme = existsSync(join(pluginDir, 'README.md'));

  return {
    name: entry.name,
    version: entry.version || manifest.version || '',
    description: entry.description || manifest.description || '',
    author: (entry.author && entry.author.name) || (manifest.author && manifest.author.name) || 'Unknown',
    authorUrl: (entry.author && entry.author.url) || (manifest.author && manifest.author.url) || '',
    source: entry.source,
    category: CATEGORY[entry.name] || entry.category || 'Other',
    keywords: (manifest.keywords || manifest.tags || []).slice(0, 12),
    license: manifest.license || 'MIT',
    homepage: manifest.homepage || '',
    counts: { commands, agents, skills, hooks },
    mcp,
    hasReadme,
  };
}

function main() {
  const marketplace = JSON.parse(readFileSync(MARKETPLACE, 'utf8'));
  const plugins = marketplace.plugins.map(scanPlugin).sort((a, b) => a.name.localeCompare(b.name));

  const totals = plugins.reduce(
    (acc, p) => {
      acc.commands += p.counts.commands;
      acc.agents += p.counts.agents;
      acc.skills += p.counts.skills;
      acc.hooks += p.counts.hooks;
      if (p.mcp) acc.mcp += 1;
      return acc;
    },
    { commands: 0, agents: 0, skills: 0, hooks: 0, mcp: 0 },
  );

  const categories = [...new Set(plugins.map((p) => p.category))].sort();

  const data = {
    meta: {
      name: marketplace.name,
      version: marketplace.version,
      description: marketplace.description,
      owner: marketplace.owner,
      generatedAt: new Date().toISOString(),
      repo: 'https://github.com/markus41/claude',
    },
    stats: {
      plugins: plugins.length,
      subplugins: SUBPLUGINS.length,
      ...totals,
      categories: categories.length,
    },
    categories,
    plugins,
    subplugins: SUBPLUGINS,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(data, null, 2) + '\n');

  console.log(`✓ site data written to ${OUT_FILE}`);
  console.log(`  ${plugins.length} plugins · ${totals.commands} commands · ${totals.agents} agents · ${totals.skills} skills · ${totals.mcp} with MCP`);
}

main();
