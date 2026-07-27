const { execSync } = require('child_process');
try {
  execSync('git checkout client/src/app/user-page/user-features/scan/scan.ts', { stdio: 'inherit' });
  console.log('Restored scan.ts successfully!');
} catch (e) {
  console.error('Failed to restore:', e);
}
