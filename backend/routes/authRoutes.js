const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  seedAdmin,
  adminCreateUser,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// ---------- Public routes ----------
router.post('/register', registerUser); // always creates a `student` account
router.post('/login', loginUser);

// One-time setup route — protected by a shared secret (not JWT), since no
// admin account exists yet the very first time this is called.
// See authController.seedAdmin for details.
router.post('/seed-admin', seedAdmin);

// ---------- Authenticated routes ----------
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);

// ---------- Admin-only routes ----------
// Used by the Admin Dashboard to provision Educator / Industry accounts.
router.post('/admin/create-user', protect, authorize('admin'), adminCreateUser);

module.exports = router;
