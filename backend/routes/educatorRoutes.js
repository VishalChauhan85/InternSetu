const express = require('express');
const router = express.Router();
const {
  listStudents,
  createCourse,
  listMyCourses,
  updateCourse,
} = require('../controllers/educatorController');
const { protect, authorize } = require('../middleware/auth');

// All routes below require authentication + educator role
router.use(protect, authorize('educator'));

router.get('/students', listStudents);

router.post('/courses', createCourse);
router.get('/courses', listMyCourses);
router.put('/courses/:id', updateCourse);

module.exports = router;
