const express = require('express');
const router = express.Router();
const {
  createOpportunity,
  listMyOpportunities,
  getApplicants,
  updateApplicantStatus,
} = require('../controllers/industryController');
const { protect, authorize } = require('../middleware/auth');

// All routes below require authentication + industry role
router.use(protect, authorize('industry'));

router.post('/opportunities', createOpportunity);
router.get('/opportunities', listMyOpportunities);
router.get('/opportunities/:id/applicants', getApplicants);
router.put('/opportunities/:id/applicants/:studentId', updateApplicantStatus);

module.exports = router;
