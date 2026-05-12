import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

let db = null;

export function getFirestore() {
  if (!db) throw new Error('Firebase not initialized');
  return db;
}

export async function connectDb() {
  if (db) return db;

  const { firebaseServiceAccountPath, firebaseServiceAccountJson } = config;

  let credential;
  if (firebaseServiceAccountJson) {
    try {
      const key = JSON.parse(firebaseServiceAccountJson);
      credential = admin.credential.cert(key);
    } catch (e) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  } else if (firebaseServiceAccountPath) {
    // Resolve path relative to backend folder so it works from any cwd
    const resolvedPath = path.isAbsolute(firebaseServiceAccountPath)
      ? firebaseServiceAccountPath
      : path.resolve(backendRoot, firebaseServiceAccountPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `Firebase service account file not found: ${resolvedPath}. ` +
          'Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to the path relative to the backend folder (e.g. ./roadmap-xxx.json).'
      );
    }
    const key = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    credential = admin.credential.cert(key);
  } else {
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({ credential });
  db = admin.firestore();
  console.log('Firebase connected');
  return db;
}
