// UPDATES APPLIED: 1 (connected), 2 (no plaintext pw), 3 (env JWT secret),
//                  11 (input validation), 12 (try/catch error handling)
// REVISED: MongoDB/Mongoose calls replaced with Firestore (userModel.js)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
require('dotenv').config();

// UPDATE 11: Validate required fields manually (or swap for express-validator)
function validateRegister({ name, email, phone, password, blood_group, location }) {
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters.');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Valid email is required.');
  if (!phone || !/^[0-9]{10}$/.test(phone)) errors.push('Phone must be a 10-digit number.');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters.');
  if (!blood_group || !UserModel.ALLOWED_BLOOD_GROUPS.includes(blood_group))
    errors.push('Valid blood group is required.');
  if (!location || location.trim().length < 2) errors.push('City/location is required.');
  return errors;
}

// UPDATE 1: Register - saves to Firestore, returns JWT
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, blood_group, location, notes } = req.body;

    // UPDATE 11: Input validation
    const errors = validateRegister({ name, email, phone, password, blood_group, location });
    if (errors.length) return res.status(400).json({ errors });

    const existingDoc = await UserModel.findByEmail(email.toLowerCase());
    if (existingDoc) return res.status(400).json({ error: 'Email already registered.' });

    // UPDATE 2: Hash password before saving (bcrypt)
    const hashed = await bcrypt.hash(password, 10);
    const userDoc = await UserModel.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      blood_group,
      location,
      notes: notes || '',
    });
    const user = UserModel.toUserResponse(userDoc);

    // UPDATE 3: JWT secret from environment variable
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, blood_group: user.blood_group, location: user.location },
    });
  } catch (err) {
    next(err); // UPDATE 12: pass to error handler
  }
};

// UPDATE 1: Login - verifies against Firestore, returns JWT
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // UPDATE 11: Validation
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const userDoc = await UserModel.findByEmail(email.toLowerCase());
    if (!userDoc) return res.status(400).json({ error: 'Invalid email or password.' });
    const user = UserModel.toUserResponse(userDoc);

    // UPDATE 2: Compare using bcrypt (no plaintext)
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid email or password.' });

    // UPDATE 3: JWT secret from env
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, blood_group: user.blood_group, location: user.location },
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE 6: Get logged-in user's profile
exports.getProfile = async (req, res, next) => {
  try {
    const userDoc = await UserModel.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: 'User not found.' });
    res.json(UserModel.toPublicUser(userDoc));
  } catch (err) {
    next(err);
  }
};

// UPDATE 6: Edit/update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, notes, blood_group } = req.body;
    const errors = [];
    if (name && name.trim().length < 2) errors.push('Name too short.');
    if (phone && !/^[0-9]{10}$/.test(phone)) errors.push('Invalid phone number.');
    if (blood_group && !UserModel.ALLOWED_BLOOD_GROUPS.includes(blood_group)) errors.push('Invalid blood group.');
    if (errors.length) return res.status(400).json({ errors });

    // Only patch fields that were actually sent
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (location !== undefined) updates.location = location;
    if (notes !== undefined) updates.notes = notes;
    if (blood_group !== undefined) updates.blood_group = blood_group;

    const updatedDoc = await UserModel.updateById(req.user.id, updates);
    res.json(UserModel.toPublicUser(updatedDoc));
  } catch (err) {
    next(err);
  }
};

// UPDATE 7: Toggle donor availability
exports.toggleAvailability = async (req, res, next) => {
  try {
    const userDoc = await UserModel.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: 'User not found.' });

    const updatedDoc = await UserModel.updateById(req.user.id, { available: !userDoc.data().available });
    res.json({ available: updatedDoc.data().available });
  } catch (err) {
    next(err);
  }
};

// UPDATE 1: Search donors - from Firestore instead of localStorage
exports.getDonors = async (req, res, next) => {
  try {
    const { blood_group, location } = req.query;
    const docs = await UserModel.findAvailable({ blood_group, location });
    res.json(docs.map(UserModel.toPublicUser));
  } catch (err) {
    next(err);
  }
};
