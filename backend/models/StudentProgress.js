const mongoose = require('mongoose');

const StudentProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
    },
    proficiency: {
      type: Number, // 0-100
      default: 0,
      min: 0,
      max: 100,
    },
    milestones: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
        },
      },
    ],
    activityLog: [
      {
        action: {
          type: String, // e.g., 'course_completed', 'quiz_passed', 'application_submitted'
          required: true,
        },
        description: {
          type: String,
          trim: true,
        },
        pointsEarned: {
          type: Number,
          default: 0,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalPoints: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        name: { type: String, trim: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

StudentProgressSchema.index({ user: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('StudentProgress', StudentProgressSchema);
