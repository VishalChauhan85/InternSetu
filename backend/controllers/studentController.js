const StudentProfile = require('../models/StudentProfile');
const StudentProgress = require('../models/StudentProgress');
const Opportunity = require('../models/Opportunity');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get logged-in student's full profile
// @route   GET /api/student/profile
// @access  Private (student)
const getStudentProfile = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ user: req.user._id })
      .populate('user', 'name email role phone')
      .populate('savedOpportunities')
      .populate('enrolledCourses.course', 'title category thumbnailUrl');

    if (!profile) {
      profile = await StudentProfile.create({ user: req.user._id });
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error('getStudentProfile error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// @desc    Update logged-in student's profile
// @route   PUT /api/student/profile
// @access  Private (student)
const updateStudentProfile = async (req, res) => {
  try {
    const allowedFields = [
      'institution',
      'course',
      'branch',
      'yearOfStudy',
      'graduationYear',
      'cgpa',
      'bio',
      'skills',
      'interests',
      'resumeUrl',
      'portfolioUrl',
      'linkedinUrl',
      'githubUrl',
      'location',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    let profile = await StudentProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new StudentProfile({ user: req.user._id, ...updates });
    } else {
      Object.assign(profile, updates);
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('updateStudentProfile error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// @desc    Get dashboard stats/summary for the student
// @route   GET /api/student/dashboard
// @access  Private (student)
const getDashboardStats = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });

    const progressDocs = await StudentProgress.find({ user: req.user._id });

    const totalPoints = progressDocs.reduce((sum, p) => sum + (p.totalPoints || 0), 0);
    const totalBadges = progressDocs.reduce((sum, p) => sum + (p.badges?.length || 0), 0);

    const appliedCount = profile?.appliedOpportunities?.length || 0;
    const shortlistedCount =
      profile?.appliedOpportunities?.filter((a) => a.status === 'shortlisted').length || 0;
    const selectedCount =
      profile?.appliedOpportunities?.filter((a) => a.status === 'selected').length || 0;

    const enrolledCoursesCount = profile?.enrolledCourses?.length || 0;
    const completedCoursesCount =
      profile?.enrolledCourses?.filter((c) => c.completed).length || 0;

    // Recommended opportunities based on student's skills (basic matching)
    const skills = profile?.skills || [];
    let recommendedOpportunities = [];
    if (skills.length > 0) {
      recommendedOpportunities = await Opportunity.find({
        status: 'open',
        requiredSkills: { $in: skills },
      })
        .limit(5)
        .select('title companyName type location applicationDeadline requiredSkills');
    } else {
      recommendedOpportunities = await Opportunity.find({ status: 'open' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title companyName type location applicationDeadline requiredSkills');
    }

    return res.status(200).json({
      success: true,
      stats: {
        profileCompleteness: profile?.profileCompleteness || 0,
        totalPoints,
        totalBadges,
        applications: {
          applied: appliedCount,
          shortlisted: shortlistedCount,
          selected: selectedCount,
        },
        courses: {
          enrolled: enrolledCoursesCount,
          completed: completedCoursesCount,
        },
      },
      recommendedOpportunities,
      recentActivity: progressDocs
        .flatMap((p) => p.activityLog.map((a) => ({ ...a.toObject(), skill: p.skill })))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10),
    });
  } catch (error) {
    console.error('getDashboardStats error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching dashboard data' });
  }
};

// @desc    List open opportunities (with basic filters)
// @route   GET /api/student/opportunities
// @access  Private (student)
const listOpportunities = async (req, res) => {
  try {
    const { type, location, search, page = 1, limit = 10 } = req.query;

    const query = { status: 'open' };
    if (type) query.type = type;
    if (location) query.location = new RegExp(location, 'i');
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [opportunities, total] = await Promise.all([
      Opportunity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-applicants'),
      Opportunity.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: opportunities.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      opportunities,
    });
  } catch (error) {
    console.error('listOpportunities error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching opportunities' });
  }
};

// @desc    Apply to an opportunity
// @route   POST /api/student/opportunities/:id/apply
// @access  Private (student)
const applyToOpportunity = async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    if (opportunity.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This opportunity is no longer accepting applications' });
    }

    const alreadyApplied = opportunity.applicants.some(
      (a) => a.student.toString() === req.user._id.toString()
    );
    if (alreadyApplied) {
      return res.status(409).json({ success: false, message: 'You have already applied to this opportunity' });
    }

    opportunity.applicants.push({ student: req.user._id });
    await opportunity.save();

    let profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) profile = new StudentProfile({ user: req.user._id });

    profile.appliedOpportunities.push({ opportunity: opportunity._id });
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('applyToOpportunity error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error submitting application' });
  }
};

// @desc    Get student's progress across all skills
// @route   GET /api/student/progress
// @access  Private (student)
const getStudentProgress = async (req, res) => {
  try {
    const progress = await StudentProgress.find({ user: req.user._id }).sort({
      updatedAt: -1,
    });
    return res.status(200).json({ success: true, progress });
  } catch (error) {
    console.error('getStudentProgress error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching progress' });
  }
};

// @desc    List published courses
// @route   GET /api/student/courses
// @access  Private (student)
const listCourses = async (req, res) => {
  try {
    const { category, level, search } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) query.$text = { $search: search };

    const courses = await Course.find(query)
      .select('-modules')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    console.error('listCourses error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching courses' });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getDashboardStats,
  listOpportunities,
  applyToOpportunity,
  getStudentProgress,
  listCourses,
};
