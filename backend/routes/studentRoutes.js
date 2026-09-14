const express = require('express');
const router = express.Router();
const {
  getStudentProfile,
  updateStudentProfile,
  getDashboardStats,
  listOpportunities,
  applyToOpportunity,
  getStudentProgress,
  listCourses,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// All routes below require authentication + student role
router.use(protect, authorize('student'));

router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);

router.get('/dashboard', getDashboardStats);

router.get('/opportunities', listOpportunities);
router.post('/opportunities/:id/apply', applyToOpportunity);

router.get('/progress', getStudentProgress);

router.get('/courses', listCourses);

module.exports = router;
