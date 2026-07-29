// UPDATE 3 (revised): User "model" — Firestore data-access layer.
// Firestore is schemaless, so this module centralizes the shape of a
// user document plus the query helpers controllers rely on.
const { db } = require('../config/firebase');

const usersCol = db.collection('users');

const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Firestore doc -> plain object (includes password hash — internal use only)
function toUserResponse(doc) {
  if (!doc || !doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// Firestore doc -> plain object with password stripped (safe to send to client)
function toPublicUser(doc) {
  const user = toUserResponse(doc);
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

async function findByEmail(email) {
  const snap = await usersCol.where('email', '==', email).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

async function findById(id) {
  const doc = await usersCol.doc(id).get();
  return doc.exists ? doc : null;
}

async function create(data) {
  const now = new Date().toISOString();
  const ref = await usersCol.add({
    ...data,
    available: true,
    createdAt: now,
    updatedAt: now,
  });
  return ref.get();
}

async function updateById(id, updates) {
  const ref = usersCol.doc(id);
  await ref.update({ ...updates, updatedAt: new Date().toISOString() });
  return ref.get();
}

// UPDATE 1 & 7: Search available donors, filtered in-memory by blood_group /
// location so no Firestore composite index is required for this demo app.
async function findAvailable({ blood_group, location } = {}) {
  const snap = await usersCol.where('available', '==', true).get();
  let docs = snap.docs;

  if (blood_group) {
    docs = docs.filter((d) => d.data().blood_group === blood_group);
  }
  if (location) {
    const needle = location.toLowerCase();
    docs = docs.filter((d) => (d.data().location || '').toLowerCase().includes(needle));
  }
  return docs;
}

module.exports = {
  usersCol,
  ALLOWED_BLOOD_GROUPS,
  findByEmail,
  findById,
  create,
  updateById,
  findAvailable,
  toUserResponse,
  toPublicUser,
};
