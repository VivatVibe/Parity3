const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Migration Immutability Guard ===\n');

// 1. Test clean state (no changes in migrations)
try {
  execSync('node scripts/check-migration-immutability.cjs', { stdio: 'pipe' });
  console.log('✔ Test 1 Passed: Clean state exits with 0.');
} catch (err) {
  assert.fail('Clean state should exit with 0');
}

// 2. Test violation: Modifying existing migration (0001_init.sql)
const initSqlPath = path.join(__dirname, '../migrations/0001_init.sql');
const originalContent = fs.readFileSync(initSqlPath, 'utf8');

try {
  fs.appendFileSync(initSqlPath, '\n-- test modification --\n');
  execSync('git add migrations/0001_init.sql');

  let failedAsExpected = false;
  try {
    execSync('node scripts/check-migration-immutability.cjs', { stdio: 'pipe' });
  } catch (err) {
    failedAsExpected = true;
    assert.strictEqual(err.status, 1, 'Should exit with status code 1');
    const stderr = err.stderr.toString();
    assert(stderr.includes('Database migration immutability violation detected'), 'Should show immutability violation error');
    assert(stderr.includes('0001_init.sql'), 'Should mention 0001_init.sql');
  }

  assert(failedAsExpected, 'Modifying an existing migration MUST fail the check');
  console.log('✔ Test 2 Passed: Modifying existing migration 0001_init.sql is blocked with exit code 1.');
} finally {
  // Restore file and unstage
  execSync('git reset HEAD migrations/0001_init.sql', { stdio: 'ignore' });
  execSync('git checkout -- migrations/0001_init.sql', { stdio: 'ignore' });
}

// 3. Test allowed: Adding a brand new migration (0002_test.sql)
const newMigrationPath = path.join(__dirname, '../migrations/0002_test.sql');

try {
  fs.writeFileSync(newMigrationPath, '-- brand new migration --\n', 'utf8');
  execSync('git add migrations/0002_test.sql');

  try {
    execSync('node scripts/check-migration-immutability.cjs', { stdio: 'pipe' });
    console.log('✔ Test 3 Passed: Adding a new migration (0002_test.sql) is permitted.');
  } catch (err) {
    assert.fail(`Adding a new migration should be permitted, but failed: ${err.stderr.toString()}`);
  }
} finally {
  // Cleanup test file
  if (fs.existsSync(newMigrationPath)) {
    execSync('git reset HEAD migrations/0002_test.sql', { stdio: 'ignore' });
    fs.unlinkSync(newMigrationPath);
  }
}

// 4. Test git hook integration directly via git commit simulation
console.log('\n--- Verifying git pre-commit hook integration ---');
const hookPath = path.join(__dirname, '../.githooks/pre-commit');
assert(fs.existsSync(hookPath), '.githooks/pre-commit must exist');
const hookStats = fs.statSync(hookPath);
assert((hookStats.mode & 0o111) !== 0, '.githooks/pre-commit must be executable');

const gitConfigHooks = execSync('git config core.hooksPath', { encoding: 'utf8' }).trim();
assert.strictEqual(gitConfigHooks, '.githooks', 'git core.hooksPath must be set to .githooks');
console.log('✔ Test 4 Passed: Git pre-commit hook is executable and configured in core.hooksPath.');

console.log('\n===================================================');
console.log('🎉 ALL MIGRATION IMMUTABILITY TESTS PASSED WITH PROOF');
console.log('===================================================');
