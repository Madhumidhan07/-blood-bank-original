// UPDATE 5 (revised): Blood Request "model" — Firestore data-access layer.
const { db } = require('../config/firebase');

const requestsCol = db.collection('requests');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['Normal', 'High', 'Critical'];

function toRequest(doc) {
  if (!doc || !doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function create(data) {
  const now = new Date().toISOString();
  const ref = await requestsCol.add({
    ...data,
    fulfilled: false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.get();
}

async function findById(id) {
  const doc = await requestsCol.doc(id).get();
  return doc.exists ? doc : null;
}

// UPDATE: fetch unfulfilled requests, filter by blood_group and sort by
// createdAt in-memory (avoids needing a Firestore composite index).
async function findActive({ blood_group } = {}) {
  const snap = await requestsCol.where('fulfilled', '==', false).get();
  let docs = snap.docs;

  if (blood_group) {
    docs = docs.filter((d) => d.data().blood_group === blood_group);
  }
  docs = docs.slice().sort((a, b) => new Date(b.data().createdAt) - new Date(a.data().createdAt));
  return docs;
}

async function findByUser(user_id) {
  const snap = await requestsCol.where('user_id', '==', user_id).get();
  return snap.docs
    .slice()
    .sort((a, b) => new Date(b.data().createdAt) - new Date(a.data().createdAt));
}

async function deleteById(id) {
  await requestsCol.doc(id).delete();
}

async function markFulfilled(id) {
  const ref = requestsCol.doc(id);
  await ref.update({ fulfilled: true, updatedAt: new Date().toISOString() });
  return ref.get();
}

module.exports = {
  requestsCol,
  BLOOD_GROUPS,
  URGENCY_LEVELS,
  create,
  findById,
  findActive,
  findByUser,
  deleteById,
  markFulfilled,
  toRequest,
};
