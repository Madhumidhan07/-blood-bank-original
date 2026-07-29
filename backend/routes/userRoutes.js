// UPDATE 1: All routes connected to real controller functions
// UPDATE 13: Rate limiting on auth routes
// (Unchanged by the Firebase migration — routes just call the controller)
const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/authMiddleware');
const {
  registerUser, loginUser, getProfile,
  updateProfile, toggleAvailability, getDonors
} = require('../controllers/userController');

const router = express.Router();

// UPDATE 13: Rate limiting - max 10 login/register attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/donors', getDonors);           // Search donors from Firestore

// Protected routes (require JWT)
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.patch('/availability', auth, toggleAvailability);

module.exports = router;
