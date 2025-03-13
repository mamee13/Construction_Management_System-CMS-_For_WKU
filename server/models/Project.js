const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, 'Please provide the project name'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  projectDescription: {
    type: String,
    required: [true, 'Please provide a project description'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide the start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide the end date'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after the start date'
    }
  },
  projectLocation: {
    type: String,
    required: [true, 'Please provide the project location'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  projectBudget: {
    type: Number,
    required: [true, 'Please provide the project budget'],
    min: [0, 'Budget cannot be negative']
  },
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a contractor to the project']
  },
  consultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a consultant to the project']
  },
  materials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  schedules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'on_hold'],
    default: 'planned'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // Duration in days
});

// Cascade delete materials, schedules and comments when a project is deleted
projectSchema.pre('remove', async function(next) {
    await this.model('Material').deleteMany({ project: this._id });
    await this.model('Schedule').deleteMany({ project: this._id });
    await this.model('Comment').deleteMany({ project: this._id });
    next();
  });

// Indexes for performance
projectSchema.index({ projectName: 1, status: 1 });
projectSchema.index({ contractor: 1 });

module.exports = mongoose.model('Project', projectSchema);