#!/usr/bin/env node
/**
 * Production Readiness Checker
 * Scans codebase for common production issues
 */

const fs = require('fs');
const path = require('path');

const targetDirs = ['src'];
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const excludedDirs = ['node_modules', '.next', 'prisma/client', 'dist', 'build'];

let issues = {
  consoleLogs: [],
  debugStatements: [],
  todoComments: [],
  hardcodedSecrets: []
};

function shouldExclude(filePath) {
  return excludedDirs.some(excluded => filePath.includes(excluded));
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Check for console statements (except console.error)
      if (/console\.(log|info|warn|debug)/.test(trimmed)) {
        issues.consoleLogs.push(`${filePath}:${lineNum}`);
      }

      // Check for debugger statements
      if (/\bdebugger\b/.test(trimmed)) {
        issues.debugStatements.push(`${filePath}:${lineNum}`);
      }

      // Check for TODO/FIXME comments
      if (/\/\/.*\b(TODO|FIXME|HACK|XXX)\b/.test(trimmed)) {
        issues.todoComments.push(`${filePath}:${lineNum}: ${trimmed}`);
      }

      // Check for potential hardcoded secrets (basic check)
      if (/['"]sk_live_|['"]pk_live_|password\s*=\s*['"][^'"]{8,}/.test(trimmed)) {
        issues.hardcodedSecrets.push(`${filePath}:${lineNum}`);
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

function walkDirectory(dir) {
  if (shouldExclude(dir)) return;

  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDirectory(filePath);
      } else if (fileExtensions.some(ext => file.endsWith(ext))) {
        checkFile(filePath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
}

console.log('🔍 Checking production readiness...\n');

targetDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    walkDirectory(fullPath);
  }
});

// Print results
let allClear = true;

if (issues.consoleLogs.length > 0) {
  allClear = false;
  console.log(`⚠️  Found ${issues.consoleLogs.length} console.log statements:`);
  issues.consoleLogs.slice(0, 10).forEach(loc => console.log(`   ${loc}`));
  if (issues.consoleLogs.length > 10) {
    console.log(`   ... and ${issues.consoleLogs.length - 10} more`);
  }
  console.log();
}

if (issues.debugStatements.length > 0) {
  allClear = false;
  console.log(`⚠️  Found ${issues.debugStatements.length} debugger statements:`);
  issues.debugStatements.forEach(loc => console.log(`   ${loc}`));
  console.log();
}

if (issues.hardcodedSecrets.length > 0) {
  allClear = false;
  console.log(`🚨 Found ${issues.hardcodedSecrets.length} potential hardcoded secrets:`);
  issues.hardcodedSecrets.forEach(loc => console.log(`   ${loc}`));
  console.log();
}

if (issues.todoComments.length > 0) {
  console.log(`ℹ️  Found ${issues.todoComments.length} TODO/FIXME comments (informational):`);
  issues.todoComments.slice(0, 5).forEach(loc => console.log(`   ${loc.substring(0, 100)}`));
  if (issues.todoComments.length > 5) {
    console.log(`   ... and ${issues.todoComments.length - 5} more`);
  }
  console.log();
}

if (allClear) {
  console.log('✅ All checks passed! Your code is production-ready.\n');
  process.exit(0);
} else {
  console.log('❌ Production readiness issues found. Please review and fix.\n');
  console.log('💡 Run "node scripts/cleanup-console-logs.js" to automatically remove console.log statements.\n');
  process.exit(1);
}
