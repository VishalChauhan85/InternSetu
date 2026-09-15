const express = require('express');
const router = express.Router();
const {
  analyzeResume,
  suggestSkillGap,
  chatAssistant,
  evaluateInterview,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All AI routes require authentication
router.use(protect);

router.post('/resume-analysis', analyzeResume);
router.post('/skill-gap', suggestSkillGap);
router.post('/chat', chatAssistant);
router.post('/mock-interview/evaluate', evaluateInterview);

module.exports = router;
