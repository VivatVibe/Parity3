const { execSync } = require('child_process');

function checkMigrationImmutability() {
  let hasHead = true;
  try {
    execSync('git rev-parse --verify HEAD', { stdio: 'ignore' });
  } catch {
    hasHead = false;
  }

  if (!hasHead) return;

  // Check staged changes (pre-commit mode)
  const stagedDiff = execSync('git diff --cached --name-status migrations', { encoding: 'utf8' }).trim();
  
  if (!stagedDiff) {
    // Nothing staged in migrations/
    return;
  }

  const lines = stagedDiff.split('\n').filter(Boolean);
  const violations = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const status = parts[0];
    const filePath = parts.slice(1).join(' ');

    // If the file was Modified (M), Deleted (D), or Renamed (R)
    if (status.startsWith('M') || status.startsWith('D') || status.startsWith('R')) {
      // Confirm the file actually existed in HEAD
      try {
        execSync(`git cat-file -e "HEAD:${filePath}"`, { stdio: 'ignore' });
        violations.push({ file: filePath, status });
      } catch {
        // Did not exist in HEAD, likely a newly staged file
      }
    }
  }

  if (violations.length > 0) {
    console.error('\n\x1b[31m❌ ERROR: Database migration immutability violation detected!\x1b[0m\n');
    violations.forEach(v => {
      console.error(`  \x1b[33m• [${v.status}] ${v.file}\x1b[0m`);
    });
    console.error('\nExisting database migrations are immutable once committed.');
    console.error('Editing or deleting historical migration files breaks production database states.');
    console.error('Revert changes to existing files and create a new migration file instead:');
    console.error('  e.g. \x1b[32mmigrations/0002_add_new_feature.sql\x1b[0m\n');
    process.exit(1);
  }
}

checkMigrationImmutability();
