#!/usr/bin/env node
const { execSync } = require('child_process');
process.env.PORT = '3000';
process.env.BROWSER = 'none';
try {
  execSync('npx react-scripts start', {
    stdio: 'inherit',
    cwd: require('path').resolve(__dirname, '..'),
    env: { ...process.env, PORT: '3000', BROWSER: 'none' }
  });
} catch (e) {
  process.exit(1);
}
