const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const repositoryRoot = path.resolve(__dirname, '..', '..');
const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

if (!projectId || !/^[a-z0-9-]{3,30}$/.test(projectId) || /your-|placeholder/i.test(projectId)) {
  console.error('Set a valid FIREBASE_PROJECT_ID in backend/.env before starting Firebase emulators.');
  process.exit(1);
}

const exportDirectory = './.firebase-emulator-data';
const exportMetadata = path.join(repositoryRoot, exportDirectory, 'firebase-export-metadata.json');
const args = [
  'emulators:start',
  '--only', 'firestore,storage',
  '--project', projectId,
  '--non-interactive',
  `--export-on-exit=${exportDirectory}`,
];

if (fs.existsSync(exportMetadata)) args.push(`--import=${exportDirectory}`);

console.log(`Starting local Firestore and Storage emulators for project ${projectId}.`);
console.log('Firebase Authentication stays connected to the configured Firebase project.');
console.log('Local emulator data is saved in .firebase-emulator-data (ignored by source control).');
console.log('Keep this terminal open while using Intervia locally.');

const child = spawn('firebase', args, {
  cwd: repositoryRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  if (error.code === 'ENOENT') {
    console.error('Firebase CLI was not found. Install it once with: npm install -g firebase-tools');
  } else {
    console.error(`Could not start Firebase emulators: ${error.message}`);
  }
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
