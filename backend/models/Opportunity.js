const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['internship', 'job', 'project', 'research'],
      required: true,
      default: 'internship',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    responsibilities: [
      {
        type: String,
        trim: true,
      },
    ],
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    eligibility: {
      minCgpa: { type: Number, default: 0 },
      years: [{ type: Number }], // eligible years of study
      branches: [{ type: String, trim: true }],
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    workMode: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'remote',
    },
    duration: {
      type: String,
      trim: true, // e.g., "3 months"
    },
    stipend: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      isPaid: { type: Boolean, default: true },
    },
    openings: {
      type: Number,
      default: 1,
      min: 1,
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'archived'],
      default: 'open',
    },
    applicants: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['applied', 'shortlisted', 'rejected', 'selected'],
          default: 'applied',
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

OpportunitySchema.index({ title: 'text', description: 'text', tags: 'text' });
OpportunitySchema.index({ status: 1, applicationDeadline: 1 });

module.exports = mongoose.model('Opportunity', OpportunitySchema);
