const express = require('express');
const router = express.Router();
const {
  listStudents,
  getStudentDetail,
  listMyCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/educatorController');
const { protect, authorize } = require('../middleware/auth');

// All routes below require authentication + educator role
router.use(protect, authorize('educator'));

router.get('/students', listStudents);
router.get('/students/:id', getStudentDetail);

router.get('/courses', listMyCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

module.exports = router;
