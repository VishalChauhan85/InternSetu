const express = require('express');
const router = express.Router();
const {
  listMyOpportunities,
  createOpportunity,
  updateOpportunity,
  getApplicants,
  updateApplicantStatus,
} = require('../controllers/industryController');
const { protect, authorize } = require('../middleware/auth');

// All routes below require authentication + industry role
router.use(protect, authorize('industry'));

router.get('/opportunities', listMyOpportunities);
router.post('/opportunities', createOpportunity);
router.put('/opportunities/:id', updateOpportunity);

router.get('/opportunities/:id/applicants', getApplicants);
router.patch('/opportunities/:id/applicants/:studentId', updateApplicantStatus);

module.exports = router;
