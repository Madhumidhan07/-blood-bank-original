// UPDATE 5: Request controller - full CRUD for blood requests
// UPDATE 11: Input validation, UPDATE 12: Error handling
// REVISED: MongoDB/Mongoose calls replaced with Firestore (requestModel.js)
const RequestModel = require('../models/requestModel');
const UserModel = require('../models/userModel');
require('dotenv').config();

// Get all requests (public, with optional blood group filter)
exports.getRequests = async (req, res, next) => {
  try {
    const { blood_group } = req.query;
    const docs = await RequestModel.findActive({ blood_group });
    res.json(docs.map(RequestModel.toRequest));
  } catch (err) {
    next(err);
  }
};

// Create a blood request (login required)
exports.createRequest = async (req, res, next) => {
  try {
    const { patient_name, hospital, location, blood_group, date_needed, urgency } = req.body;

    // UPDATE 11: Validate
    const errors = [];
    if (!patient_name) errors.push('Patient name is required.');
    if (!hospital) errors.push('Hospital is required.');
    if (!location) errors.push('City is required.');
    if (!blood_group || !RequestModel.BLOOD_GROUPS.includes(blood_group))
      errors.push('Valid blood group is required.');
    if (!date_needed) errors.push('Date needed is required.');
    if (errors.length) return res.status(400).json({ errors });

    // Fetch contact info from requesting user
    const userDoc = await UserModel.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: 'User not found.' });
    const user = userDoc.data();

    const requestDoc = await RequestModel.create({
      user_id: req.user.id,
      patient_name,
      hospital,
      location,
      blood_group,
      date_needed,
      urgency: urgency && RequestModel.URGENCY_LEVELS.includes(urgency) ? urgency : 'Normal',
      contact: { name: user.name, phone: user.phone, email: user.email },
    });
    res.status(201).json(RequestModel.toRequest(requestDoc));
  } catch (err) {
    next(err);
  }
};

// Get requests by the logged-in user
exports.getMyRequests = async (req, res, next) => {
  try {
    const docs = await RequestModel.findByUser(req.user.id);
    res.json(docs.map(RequestModel.toRequest));
  } catch (err) {
    next(err);
  }
};

// Delete / remove a request (only owner)
exports.deleteRequest = async (req, res, next) => {
  try {
    const doc = await RequestModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Request not found.' });
    const request = RequestModel.toRequest(doc);
    if (request.user_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to delete this request.' });

    await RequestModel.deleteById(req.params.id);
    res.json({ message: 'Request removed.' });
  } catch (err) {
    next(err);
  }
};

// Mark a request as fulfilled
exports.fulfillRequest = async (req, res, next) => {
  try {
    const doc = await RequestModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Request not found.' });
    const request = RequestModel.toRequest(doc);
    if (request.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized.' });

    await RequestModel.markFulfilled(req.params.id);
    res.json({ message: 'Request marked as fulfilled.' });
  } catch (err) {
    next(err);
  }
};
