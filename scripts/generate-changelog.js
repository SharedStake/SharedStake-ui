#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SECTION_ORDER = [
  'Features',
  'Fixes',
  'Documentation',
  'Refactors',
  'Performance',
  'Build',
  'CI',
  'Tests',
  'Style',
  'Chores',
  'Reverts',
  'Other',
];

const SECTION_MAP = {
  feat: 'Features',
  fix: 'Fixes',
  docs: 'Documentation',
  refactor: 'Refactors',
  perf: 'Performance',
  build: 'Build',
  ci: 'CI',
  test: 'Tests',
  style: 'Style',
  chore: 'Chores',
  revert: 'Reverts',
};

function run(command, fallback = '') {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
}

function parseArgs(argv) {
  const args = {
    from: undefined,
    to: 'HEAD',
    output: 'CHANGELOG.md',
    mode: 'replace',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--from') {
      args.from = argv[i + 1];
      i += 1;
    } else if (token.startsWith('--from=')) {
      args.from = token.slice('--from='.length);
    } else if (token === '--to') {
      args.to = argv[i + 1];
      i += 1;
    } else if (token.startsWith('--to=')) {
      args.to = token.slice('--to='.length);
    } else if (token === '--output') {
      args.output = argv[i + 1];
      i += 1;
    } else if (token.startsWith('--output=')) {
      args.output = token.slice('--output='.length);
    } else if (token === '--append') {
      args.mode = 'append';
    } else if (token === '--replace') {
      args.mode = 'replace';
    } else if (token === '--help' || token === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  if (!args.to) {
    throw new Error('Missing value for --to');
  }
  if (!args.output) {
    throw new Error('Missing value for --output');
  }

  return args;
}

function printHelp() {
  process.stdout.write(`Generate a markdown changelog from git commits.\n\n`);
  process.stdout.write(`Usage:\n`);
  process.stdout.write(`  node scripts/generate-changelog.js [options]\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  --from <ref>      Start ref (default: latest tag, or full history when no tag exists)\n`);
  process.stdout.write(`  --to <ref>        End ref (default: HEAD)\n`);
  process.stdout.write(`  --output <file>   Output file (default: CHANGELOG.md)\n`);
  process.stdout.write(`  --append          Append generated block to existing changelog\n`);
  process.stdout.write(`  --replace         Replace output file content (default)\n`);
  process.stdout.write(`  -h, --help        Show this help\n`);
}

function getRemoteInfo() {
  const remote = run('git config --get remote.origin.url');
  if (!remote) return null;

  let match = remote.match(/^git@github\.com:([^/]+)\/(.+?)(\.git)?$/);
  if (!match) {
    match = remote.match(/^https:\/\/github\.com\/([^/]+)\/(.+?)(\.git)?$/);
  }
  if (!match) return null;

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');
  const base = `https://github.com/${owner}/${repo}`;

  return {
    base,
    commitUrl: (hash) => `${base}/commit/${hash}`,
    compareUrl: (from, to) => `${base}/compare/${from}...${to}`,
  };
}

function classifySubject(subject) {
  const conventional = subject.match(/^([a-z]+)(\(.+\))?(!)?:\s+(.+)$/i);
  if (!conventional) {
    return { section: 'Other', text: subject };
  }

  const type = conventional[1].toLowerCase();
  const mapped = SECTION_MAP[type] || 'Other';
  const text = conventional[4].trim();

  return {
    section: mapped,
    text: text || subject,
  };
}

function getLatestTag() {
  return run('git describe --tags --abbrev=0', '');
}

function getRange(fromRef, toRef) {
  if (fromRef) {
    return `${fromRef}..${toRef}`;
  }
  return toRef;
}

function parseCommits(rangeExpr) {
  const format = '%H%x1f%h%x1f%ad%x1f%s%x1e';
  const command = `git log --date=short --pretty=format:${format} ${rangeExpr}`;
  const raw = run(command);

  if (!raw) return [];

  return raw
    .split('\x1e')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [hash, shortHash, date, subject] = row.split('\x1f');
      const classified = classifySubject(subject);
      return {
        hash,
        shortHash,
        date,
        subject,
        section: classified.section,
        text: classified.text,
      };
    });
}

function buildChangelogBlock({ commits, fromRef, toRef, remoteInfo }) {
  const lines = [];
  lines.push(`Generated from \`${fromRef || 'repository start'}\` to \`${toRef}\`.`);

  if (fromRef && remoteInfo) {
    lines.push(`Compare: [${fromRef}...${toRef}](${remoteInfo.compareUrl(fromRef, toRef)}).`);
  }

  lines.push('');

  if (commits.length === 0) {
    lines.push('No changes found in the selected range.');
    return lines.join('\n');
  }

  const byDate = new Map();

  for (const commit of commits) {
    if (!byDate.has(commit.date)) {
      byDate.set(commit.date, []);
    }
    byDate.get(commit.date).push(commit);
  }

  for (const [date, dateCommits] of byDate.entries()) {
    lines.push(`## ${date}`);
    lines.push('');

    for (const section of SECTION_ORDER) {
      const sectionCommits = dateCommits.filter((commit) => commit.section === section);
      if (sectionCommits.length === 0) continue;

      lines.push(`### ${section}`);
      for (const commit of sectionCommits) {
        const ref = remoteInfo
          ? `[${commit.shortHash}](${remoteInfo.commitUrl(commit.hash)})`
          : `\`${commit.shortHash}\``;
        lines.push(`- ${commit.text} (${ref})`);
      }
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd();
}

function buildFinalOutput(block, mode, outputPath) {
  const header = '# Changelog';

  if (mode === 'replace') {
    return `${header}\n\n${block}\n`;
  }

  if (!fs.existsSync(outputPath)) {
    return `${header}\n\n${block}\n`;
  }

  const existing = fs.readFileSync(outputPath, 'utf8').trimEnd();
  if (!existing) {
    return `${header}\n\n${block}\n`;
  }

  if (existing.startsWith(header)) {
    return `${existing}\n\n${block}\n`;
  }

  return `${header}\n\n${existing}\n\n${block}\n`;
}

function ensureOutputDir(outputPath) {
  const dir = path.dirname(outputPath);
  if (dir && dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const resolvedFrom = args.from ?? getLatestTag();
  const rangeExpr = getRange(resolvedFrom, args.to);
  const commits = parseCommits(rangeExpr);
  const remoteInfo = getRemoteInfo();

  const block = buildChangelogBlock({
    commits,
    fromRef: resolvedFrom,
    toRef: args.to,
    remoteInfo,
  });

  ensureOutputDir(args.output);
  const output = buildFinalOutput(block, args.mode, args.output);

  fs.writeFileSync(args.output, output);
  process.stdout.write(`Wrote ${args.output} with ${commits.length} commit(s).\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
