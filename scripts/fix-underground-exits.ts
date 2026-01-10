import * as fs from 'fs';
import * as path from 'path';

const basePath = '/var/tmp/vibe-kanban/worktrees/603f-where-are-we-at/malice/src/database/bootstrap/world/seattle/pioneer-square/buildings';

// Find all files with underground references
function findFilesWithUnderground(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFilesWithUnderground(fullPath));
    } else if (entry.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes("underground/upper-tunnels") ||
          content.includes("underground/transitional") ||
          content.includes("underground/entries")) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

// Process a single file - remove exit entries that reference underground files
function processFile(filePath: string): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Pattern to match exit entries like:
  // direction: { to: 'underground/...', ... },
  const patterns = [
    /\s*\w+:\s*\{\s*\n?\s*to:\s*['"]underground\/upper-tunnels\/[^'"]+['"][^}]*\},?\n?/g,
    /\s*\w+:\s*\{\s*\n?\s*to:\s*['"]underground\/transitional\/[^'"]+['"][^}]*\},?\n?/g,
    /\s*\w+:\s*\{\s*\n?\s*to:\s*['"]underground\/entries\/[^'"]+['"][^}]*\},?\n?/g,
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        const preview = match.trim().substring(0, 60);
        console.log('  Removing: ' + preview + '...');
      }
      content = content.replace(pattern, '');
      modified = true;
    }
  }

  if (modified) {
    // Clean up any double commas or trailing commas before }
    content = content.replace(/,(\s*),/g, ',');
    content = content.replace(/,(\s*)\}/g, '$1}');

    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

const files = findFilesWithUnderground(basePath);
console.log('Found ' + files.length + ' files with underground references\n');

let fixedCount = 0;
for (const file of files) {
  const relPath = path.relative(basePath, file);
  console.log('Processing: ' + relPath);
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log('\nFixed ' + fixedCount + ' files');
