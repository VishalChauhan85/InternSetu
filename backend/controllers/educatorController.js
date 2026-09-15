const StudentProfile = require('../models/StudentProfile');
const Course = require('../models/Course');

// @desc    List students in the educator's cohort (currently: all students on
//          the platform, filtered by institution when the educator has one set).
//          Adjust this query once cohort/institution assignment is modeled.
// @route   GET /api/educator/students
// @access  Private (educator)
const listStudents = async (req, res) => {
  try {
    const query = {};

    // Scope to the educator's own institution when available, so educators
    // only see their own students rather than the entire platform.
    if (req.user.institutionName) {
      query.institution = req.user.institutionName;
    }

    const students = await StudentProfile.find(query)
      .populate('user', 'name email phone')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('listStudents error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching students' });
  }
};

// @desc    Get a single student's detailed profile (for progress monitoring)
// @route   GET /api/educator/students/:id
// @access  Private (educator)
const getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await StudentProfile.findOne({ user: id })
      .populate('user', 'name email phone')
      .populate('enrolledCourses.course', 'title category level')
      .populate('appliedOpportunities.opportunity', 'title companyName type');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.status(200).json({ success: true, student: profile });
  } catch (error) {
    console.error('getStudentDetail error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching student detail' });
  }
};

// @desc    List courses created by the logged-in educator
// @route   GET /api/educator/courses
// @access  Private (educator)
const listMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error('listMyCourses error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching your courses' });
  }
};

// @desc    Create a new course
// @route   POST /api/educator/courses
// @access  Private (educator)
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      skillsCovered,
      level,
      thumbnailUrl,
      modules,
      durationHours,
      isPublished,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Course title and description are required',
      });
    }

    const course = await Course.create({
      createdBy: req.user._id,
      title,
      description,
      category,
      skillsCovered: skillsCovered || [],
      level: level || 'beginner',
      thumbnailUrl,
      modules: modules || [],
      durationHours: durationHours || 0,
      isPublished: !!isPublished,
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    console.error('createCourse error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: 'Server error creating course' });
  }
};

// @desc    Update a course owned by the logged-in educator (edit content, publish/unpublish)
// @route   PUT /api/educator/courses/:id
// @access  Private (educator)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, createdBy: req.user._id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you do not have permission to edit it',
      });
    }

    const allowedFields = [
      'title',
      'description',
      'category',
      'skillsCovered',
      'level',
      'thumbnailUrl',
      'modules',
      'durationHours',
      'isPublished',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    console.error('updateCourse error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating course' });
  }
};

// @desc    Delete a course owned by the logged-in educator
// @route   DELETE /api/educator/courses/:id
// @access  Private (educator)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOneAndDelete({ _id: id, createdBy: req.user._id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you do not have permission to delete it',
      });
    }

    return res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('deleteCourse error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting course' });
  }
};

module.exports = {
  listStudents,
  getStudentDetail,
  listMyCourses,
  createCourse,
  updateCourse,
  deleteCourse,
};
