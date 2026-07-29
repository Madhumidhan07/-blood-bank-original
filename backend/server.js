// UPDATES APPLIED: 1 (frontend connected via API), 12 (error handler),
//                  13 (rate limiting), 15 (env config)
// REVISED: MongoDB replaced with Firebase/Firestore
require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./config/firebase'); // Initializes Firebase Admin SDK / Firestore
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files (UPDATE 1: connect frontend)
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// UPDATE 12: Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
