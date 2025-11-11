#!/usr/bin/env node
/**
 * Production Cleanup Script
 * Removes console.log, console.info, console.warn, and console.debug statements
 * Keeps console.error for production error monitoring
 */

const fs = require('fs');
const path = require('path');

const targetDirs = ['src'];
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to remove (but keep console.error)
const consolePatterns = [
  /console\.log\([^)]*\);?\s*\n?/g,
  /console\.info\([^)]*\);?\s*\n?/g,
  /console\.warn\([^)]*\);?\s*\n?/g,
  /console\.debug\([^)]*\);?\s*\n?/g,
];

// Excluded directories
const excludedDirs = ['node_modules', '.next', 'prisma/client', 'dist', 'build'];

let totalRemoved = 0;
let filesModified = 0;

function shouldExclude(filePath) {
  return excludedDirs.some(excluded => filePath.includes(excluded));
}

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let removedInFile = 0;

    // Apply each pattern
    consolePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        removedInFile += matches.length;
        content = content.replace(pattern, '');
      }
    });

    // Remove empty lines that might be left behind
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Cleaned ${filePath} (removed ${removedInFile} statements)`);
      filesModified++;
      totalRemoved += removedInFile;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  if (shouldExclude(dir)) return;

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (fileExtensions.some(ext => file.endsWith(ext))) {
      cleanFile(filePath);
    }
  });
}

console.log('🧹 Starting console.log cleanup...\n');

targetDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Scanning ${dir}/...`);
    walkDirectory(fullPath);
  }
});

console.log(`\n✅ Cleanup complete!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Statements removed: ${totalRemoved}`);
console.log(`\n⚠️  Note: This script keeps console.error statements for production error monitoring.\n`);
