#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/**
 * Static Responsive Code Audit Script
 * Scans JSX/TSX source files for common responsive anti-patterns.
 */

const FRONTEND_SRC = path.resolve('frontend/src');

const ANTI_PATTERNS = [
  {
    name: 'Hardcoded large pixel width on element',
    regex: /(?<!max-|min-)\bw-\[\d{3,}px\]|(?<!max-|min-)width:\s*['"]?\d{3,}px/i,
    severity: 'WARNING',
    advice: 'Avoid hardcoded pixel widths >= 100px. Use max-w-* or responsive prefixes (sm:w-*, md:w-*).',
  },
  {
    name: 'Fixed height without scroll container',
    regex: /(?<!max-|min-)\bh-\[\d{3,}px\](?![^>]*overflow)/i,
    severity: 'INFO',
    advice: 'Fixed heights can cause content overflow on small screens when text wraps.',
  },
];

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (/\.(tsx|jsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runAudit() {
  console.log('🔍 Starting Responsive Code Audit on frontend/src...\n');
  const files = scanDirectory(FRONTEND_SRC);
  let totalIssues = 0;

  for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check for table wrapping
      if (/<table\b/i.test(line)) {
        const precedingLines = lines.slice(Math.max(0, lineIndex - 5), lineIndex).join(' ');
        if (!/overflow-x-(auto|scroll)/i.test(precedingLines)) {
          totalIssues++;
          console.log(`[WARNING] ${relative}:${lineIndex + 1}`);
          console.log(`   Pattern: Table without horizontal overflow wrapper`);
          console.log(`   Code:    ${line.trim().slice(0, 80)}`);
          console.log(`   Advice:  Ensure <table> is wrapped inside a <div className="overflow-x-auto ..."> container.\n`);
        }
      }

      for (const pattern of ANTI_PATTERNS) {
        if (pattern.regex && pattern.regex.test(line)) {
          totalIssues++;
          console.log(`[${pattern.severity}] ${relative}:${lineIndex + 1}`);
          console.log(`   Pattern: ${pattern.name}`);
          console.log(`   Code:    ${line.trim().slice(0, 80)}`);
          console.log(`   Advice:  ${pattern.advice}\n`);
        }
      }
    });
  }

  if (totalIssues === 0) {
    console.log('✅ Responsive Code Audit PASSED: Zero anti-patterns detected!');
  } else {
    console.log(`ℹ️ Responsive Code Audit completed: ${totalIssues} items flagged for review.`);
  }
}

runAudit();
