

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  scheduleName: {
    type: String,
    required: [true, 'Please provide the schedule name'],
    trim: true,
    maxlength: [100, 'Schedule name cannot exceed 100 characters']
  },
  scheduleDescription: {
    type: String,
    required: [true, 'Please provide a schedule description'],
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
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Please associate the schedule with a project']
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Please associate the schedule with a task']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign the schedule to a user']
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'delayed'],
    default: 'planned'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
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

// Virtual for schedule duration
scheduleSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // Duration in days
});

// Indexes for performance
scheduleSchema.index({ scheduleName: 1, status: 1 });
scheduleSchema.index({ project: 1 });
scheduleSchema.index({ task: 1 });
scheduleSchema.index({ assignedTo: 1 });

// Pre-save middleware to validate schedule dates against task and project dates
scheduleSchema.pre('save', async function(next) {
  const task = await mongoose.model('Task').findById(this.task);
  const project = await mongoose.model('Project').findById(this.project);

  if (!task || !project) {
    throw new Error('Task or project not found');
  }

  if (this.startDate < task.startDate || this.endDate > task.endDate) {
    throw new Error('Schedule dates must be within the task dates');
  }

  if (this.startDate < project.startDate || this.endDate > project.endDate) {
    throw new Error('Schedule dates must be within the project dates');
  }

  next();
});

// Post-save middleware to update task status if schedule is completed
scheduleSchema.post('save', async function(doc) {
  const task = await mongoose.model('Task').findById(doc.task);
  if (!task) return;

  if (doc.status === 'completed') {
    task.status = 'completed';
    await task.save();
  }
});

// Pre-remove middleware to update task status if schedule is deleted
scheduleSchema.pre('remove', async function(next) {
  const task = await mongoose.model('Task').findById(this.task);
  if (!task) return next();

  if (task.status === 'completed') {
    task.status = 'in_progress';
    await task.save();
  }

  next();
});

module.exports = mongoose.model('Schedule', scheduleSchema);