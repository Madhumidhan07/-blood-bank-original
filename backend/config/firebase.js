// UPDATE 15 (revised): Firebase Admin SDK / Firestore connection
// Replaces the old Mongoose/MongoDB connection (config/db.js).
const admin = require('firebase-admin');
require('dotenv').config();

function initFirebase() {
  if (admin.apps.length) return admin.app();

  try {
    // Credentials are picked up from GOOGLE_APPLICATION_CREDENTIALS (see .env),
    // which should point at your local serviceAccountKey.json file.
    // applicationDefault() reads that env var automatically — no need to
    // parse the JSON ourselves.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('Firebase (Firestore) connected');
  } catch (err) {
    console.error('Firebase connection error:', err.message);
    process.exit(1);
  }

  return admin.app();
}

initFirebase();

const db = admin.firestore();

module.exports = { admin, db };
