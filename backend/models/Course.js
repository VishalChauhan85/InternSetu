const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      enum: ['video', 'article', 'quiz', 'assignment'],
      default: 'article',
    },
    contentUrl: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const ModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    lessons: [LessonSchema],
  },
  { _id: true }
);

const CourseSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
    },
    category: {
      type: String,
      trim: true, // e.g., "Web Development", "Data Science"
    },
    skillsCovered: [
      {
        type: String,
        trim: true,
      },
    ],
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    modules: [ModuleSchema],
    durationHours: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

CourseSchema.index({ title: 'text', description: 'text', skillsCovered: 'text' });

module.exports = mongoose.model('Course', CourseSchema);
