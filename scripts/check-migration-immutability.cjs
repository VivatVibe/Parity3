const { execSync } = require('child_process');

function checkMigrationImmutability() {
  let hasHead = true;
  try {
    execSync('git rev-parse --verify HEAD', { stdio: 'ignore' });
  } catch {
    hasHead = false;
  }

  if (!hasHead) return;

  let diffOutput = '';
  const isCI = process.env.CI === 'true';

  if (isCI) {
    // In CI: Check committed changes between base and current commit
    const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
    try {
      execSync(`git rev-parse --verify ${baseRef}`, { stdio: 'ignore' });
      diffOutput = execSync(`git diff --name-status ${baseRef}...HEAD migrations`, { encoding: 'utf8' }).trim();
    } catch {
      // If baseRef is not fetched, compare with previous commit if it exists
      try {
        execSync('git rev-parse --verify HEAD~1', { stdio: 'ignore' });
        diffOutput = execSync('git diff --name-status HEAD~1..HEAD migrations', { encoding: 'utf8' }).trim();
      } catch {
        diffOutput = '';
      }
    }
  } else {
    // Local: Check staged changes (pre-commit mode)
    diffOutput = execSync('git diff --cached --name-status migrations', { encoding: 'utf8' }).trim();
  }
  
  if (!diffOutput) {
    // Nothing modified in migrations/
    return;
  }

  const lines = diffOutput.split('\n').filter(Boolean);
  const violations = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const status = parts[0];
    const filePath = parts.slice(1).join(' ');

    // If the file was Modified (M), Deleted (D), or Renamed (R)
    if (status.startsWith('M') || status.startsWith('D') || status.startsWith('R')) {
      violations.push({ file: filePath, status });
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
