#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  let configPath = 'tsconfig.json';
  const unsupported = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--noEmit') {
      continue;
    }
    if (arg === '--project' || arg === '-p') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error(`Missing value for ${arg}`);
      }
      configPath = next;
      i += 1;
      continue;
    }
    unsupported.push(arg);
  }
  if (unsupported.length > 0) {
    throw new Error(`Unsupported arguments: ${unsupported.join(', ')}`);
  }
  return { configPath };
}

function loadTsconfig(configPath) {
  const resolved = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Cannot find TypeScript config at ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, 'utf8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${resolved}: ${error.message}`);
  }
  const files = Array.isArray(config.files) && config.files.length > 0 ? config.files : ['types.ts'];
  return files.map((file) => path.resolve(path.dirname(resolved), file));
}

function checkStructure(content, filePath) {
  const stack = [];
  const pairs = { '{': '}', '(': ')', '[': ']' };
  const closing = new Set(Object.values(pairs));
  for (const char of content) {
    if (pairs[char]) {
      stack.push(pairs[char]);
    } else if (closing.has(char)) {
      const expected = stack.pop();
      if (expected !== char) {
        throw new Error(`Unbalanced syntax in ${filePath}`);
      }
    }
  }
  if (stack.length > 0) {
    throw new Error(`Unbalanced syntax in ${filePath}`);
  }
}

function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`TypeScript file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim()) {
    throw new Error(`TypeScript file is empty: ${filePath}`);
  }
  checkStructure(content, filePath);
  const exportMatches = content.match(/export\s+(interface|type)\s+\w+/g);
  if (!exportMatches) {
    throw new Error(`No export declarations detected in ${filePath}`);
  }
}

function main() {
  try {
    const { configPath } = parseArgs(process.argv.slice(2));
    const files = loadTsconfig(configPath);
    files.forEach(analyzeFile);
    console.log('TypeScript structure validated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[tsc stub]', error.message);
    process.exit(1);
  }
}

main();
