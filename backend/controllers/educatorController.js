const StudentProfile = require('../models/StudentProfile');
const Course = require('../models/Course');

// @desc    List students, scoped to the educator's institution when set
// @route   GET /api/educator/students
// @access  Private (educator)
const listStudents = async (req, res) => {
  try {
    const { search, branch } = req.query;

    // Scope to students sharing the educator's institution, when the
    // educator has one on file. Falls back to all students otherwise.
    let studentUserIds;
    if (req.user.institutionName) {
      const matchingProfiles = await StudentProfile.find({
        institution: req.user.institutionName,
      }).select('user');
      studentUserIds = matchingProfiles.map((p) => p.user);
    }

    const query = {};
    if (studentUserIds) query.user = { $in: studentUserIds };
    if (branch) query.branch = new RegExp(branch, 'i');

    let profiles = await StudentProfile.find(query)
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });

    if (search) {
      const re = new RegExp(search, 'i');
      profiles = profiles.filter(
        (p) => re.test(p.user?.name || '') || re.test(p.user?.email || '')
      );
    }

    return res.status(200).json({
      success: true,
      count: profiles.length,
      students: profiles,
    });
  } catch (error) {
    console.error('listStudents error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching students' });
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
      skillsCovered,
      level,
      thumbnailUrl,
      modules,
      durationHours,
      isPublished: Boolean(isPublished),
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

// @desc    List courses created by the logged-in educator
// @route   GET /api/educator/courses
// @access  Private (educator)
const listMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user._id })
      .select('-modules')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    console.error('listMyCourses error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching your courses' });
  }
};

// @desc    Update a course owned by the logged-in educator
// @route   PUT /api/educator/courses/:id
// @access  Private (educator)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

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

    const course = await Course.findOne({ _id: id, createdBy: req.user._id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you do not have access to it',
      });
    }

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
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: 'Server error updating course' });
  }
};

module.exports = {
  listStudents,
  createCourse,
  listMyCourses,
  updateCourse,
};
