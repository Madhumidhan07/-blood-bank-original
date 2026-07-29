// UPDATE 5: Blood request routes
// (Unchanged by the Firebase migration — routes just call the controller)
const express = require('express');
const auth = require('../middleware/authMiddleware');
const {
  getRequests, createRequest,
  getMyRequests, deleteRequest, fulfillRequest
} = require('../controllers/requestController');

const router = express.Router();

router.get('/', getRequests);                        // Public: view all active requests
router.post('/', auth, createRequest);               // Protected: post a request
router.get('/mine', auth, getMyRequests);            // Protected: my requests
router.delete('/:id', auth, deleteRequest);          // Protected: remove my request
router.patch('/:id/fulfill', auth, fulfillRequest);  // Protected: mark fulfilled

module.exports = router;
