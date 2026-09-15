const Opportunity = require('../models/Opportunity');
const StudentProfile = require('../models/StudentProfile');

const VALID_STATUSES = ['applied', 'shortlisted', 'rejected', 'selected'];

// @desc    Create a new opportunity posting
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

    const opportunity = await Opportunity.create({
      postedBy: req.user._id,
      title,
      companyName: companyName || req.user.companyName,
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
    return res.status(500).json({ success: false, message: 'Server error creating opportunity' });
  }
};

// @desc    List opportunities posted by the logged-in industry user
// @route   GET /api/industry/opportunities
// @access  Private (industry)
const listMyOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ postedBy: req.user._id }).sort({
      createdAt: -1,
    });

    // Surface an applicant count without shipping the full applicant list here
    const shaped = opportunities.map((opp) => {
      const obj = opp.toObject();
      obj.applicantCount = obj.applicants?.length || 0;
      delete obj.applicants;
      return obj;
    });

    return res.status(200).json({
      success: true,
      count: shaped.length,
      opportunities: shaped,
    });
  } catch (error) {
    console.error('listMyOpportunities error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching your postings' });
  }
};

// @desc    Get applicants for a specific opportunity owned by this industry user
// @route   GET /api/industry/opportunities/:id/applicants
// @access  Private (industry)
const getApplicants = async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await Opportunity.findOne({
      _id: id,
      postedBy: req.user._id,
    }).populate('applicants.student', 'name email phone');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or you do not have access to it',
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

// @desc    Update an applicant's status for an opportunity
// @route   PUT /api/industry/opportunities/:id/applicants/:studentId
// @access  Private (industry)
const updateApplicantStatus = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const opportunity = await Opportunity.findOne({ _id: id, postedBy: req.user._id });
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or you do not have access to it',
      });
    }

    const applicant = opportunity.applicants.find(
      (a) => a.student.toString() === studentId
    );
    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found on this opportunity',
      });
    }

    applicant.status = status;
    await opportunity.save();

    // Keep the student's own profile record in sync so their dashboard
    // stats (applied/shortlisted/selected counts) stay accurate.
    await StudentProfile.updateOne(
      { user: studentId, 'appliedOpportunities.opportunity': id },
      { $set: { 'appliedOpportunities.$.status': status } }
    );

    return res.status(200).json({
      success: true,
      message: 'Applicant status updated successfully',
      studentId,
      status,
    });
  } catch (error) {
    console.error('updateApplicantStatus error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating applicant status' });
  }
};

module.exports = {
  createOpportunity,
  listMyOpportunities,
  getApplicants,
  updateApplicantStatus,
};
