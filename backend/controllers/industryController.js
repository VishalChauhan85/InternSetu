const Opportunity = require('../models/Opportunity');
const StudentProfile = require('../models/StudentProfile');

// @desc    List opportunities posted by the logged-in industry user
// @route   GET /api/industry/opportunities
// @access  Private (industry)
const listMyOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ postedBy: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: opportunities.length,
      opportunities,
    });
  } catch (error) {
    console.error('listMyOpportunities error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching your postings' });
  }
};

// @desc    Create a new opportunity
// @route   POST /api/industry/opportunities
// @access  Private (industry)
const createOpportunity = async (req, res) => {
  try {
    const {
      title,
      companyName,
      type,
      description,
      responsibilities,
      requiredSkills,
      eligibility,
      location,
      workMode,
      duration,
      stipend,
      openings,
      applicationDeadline,
      tags,
    } = req.body;

    if (!title || !description || !applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and application deadline are required',
      });
    }

    const deadlineDate = new Date(applicationDeadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid application deadline' });
    }

    const opportunity = await Opportunity.create({
      postedBy: req.user._id,
      title,
      companyName: companyName || req.user.companyName || req.user.name,
      type: type || 'internship',
      description,
      responsibilities: responsibilities || [],
      requiredSkills: requiredSkills || [],
      eligibility: eligibility || {},
      location: location || 'Remote',
      workMode: workMode || 'remote',
      duration,
      stipend: stipend || { amount: 0, isPaid: true },
      openings: openings || 1,
      applicationDeadline: deadlineDate,
      status: 'open',
      tags: tags || [],
    });

    return res.status(201).json({
      success: true,
      message: 'Opportunity posted successfully',
      opportunity,
    });
  } catch (error) {
    console.error('createOpportunity error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: 'Server error posting opportunity' });
  }
};

// @desc    Update an opportunity owned by the logged-in industry user
// @route   PUT /api/industry/opportunities/:id
// @access  Private (industry)
const updateOpportunity = async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await Opportunity.findOne({ _id: id, postedBy: req.user._id });
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or you do not have permission to edit it',
      });
    }

    const allowedFields = [
      'title',
      'companyName',
      'type',
      'description',
      'responsibilities',
      'requiredSkills',
      'eligibility',
      'location',
      'workMode',
      'duration',
      'stipend',
      'openings',
      'applicationDeadline',
      'status',
      'tags',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        opportunity[field] = req.body[field];
      }
    });

    await opportunity.save();

    return res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully',
      opportunity,
    });
  } catch (error) {
    console.error('updateOpportunity error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating opportunity' });
  }
};

// @desc    Get applicants for a specific opportunity owned by the logged-in industry user
// @route   GET /api/industry/opportunities/:id/applicants
// @access  Private (industry)
const getApplicants = async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await Opportunity.findOne({ _id: id, postedBy: req.user._id }).populate(
      'applicants.student',
      'name email phone'
    );

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or you do not have permission to view it',
      });
    }

    return res.status(200).json({
      success: true,
      opportunityTitle: opportunity.title,
      count: opportunity.applicants.length,
      applicants: opportunity.applicants,
    });
  } catch (error) {
    console.error('getApplicants error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching applicants' });
  }
};

// @desc    Update an applicant's status on an opportunity
// @route   PATCH /api/industry/opportunities/:id/applicants/:studentId
// @access  Private (industry)
const updateApplicantStatus = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['applied', 'shortlisted', 'rejected', 'selected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const opportunity = await Opportunity.findOne({ _id: id, postedBy: req.user._id });
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or you do not have permission to modify it',
      });
    }

    const applicant = opportunity.applicants.find(
      (a) => a.student.toString() === studentId
    );

    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found on this opportunity' });
    }

    applicant.status = status;
    await opportunity.save();

    // Keep the student's own profile record in sync
    await StudentProfile.updateOne(
      { user: studentId, 'appliedOpportunities.opportunity': opportunity._id },
      { $set: { 'appliedOpportunities.$.status': status } }
    );

    return res.status(200).json({
      success: true,
      message: 'Applicant status updated successfully',
      status,
    });
  } catch (error) {
    console.error('updateApplicantStatus error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating applicant status' });
  }
};

module.exports = {
  listMyOpportunities,
  createOpportunity,
  updateOpportunity,
  getApplicants,
  updateApplicantStatus,
};
