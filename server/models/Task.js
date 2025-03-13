const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: [true, 'Please provide the task name'],
    trim: true,
    maxlength: [100, 'Task name cannot exceed 100 characters']
  },
  taskDescription: {
    type: String,
    required: [true, 'Please provide a task description'],
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
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign the task to a user']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Please associate the task with a project']
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
    default: 'not_started'
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

// Virtual for task duration
taskSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // Duration in days
});

// Indexes for performance
taskSchema.index({ taskName: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ project: 1 });

// Pre-save middleware to validate task dates against project dates
taskSchema.pre('save', async function(next) {
  const project = await mongoose.model('Project').findById(this.project);
  if (!project) {
    throw new Error('Project not found');
  }

  if (this.startDate < project.startDate || this.endDate > project.endDate) {
    throw new Error('Task dates must be within the project dates');
  }

  next();
});

// Post-save middleware to update project status if all tasks are completed
taskSchema.post('save', async function(doc) {
  const project = await mongoose.model('Project').findById(doc.project).populate('tasks');
  if (!project) return;

  const allTasksCompleted = project.tasks.every(task => task.status === 'completed');
  if (allTasksCompleted) {
    project.status = 'completed';
    await project.save();
  }
});

// Pre-remove middleware to update project status if tasks are deleted
taskSchema.pre('remove', async function(next) {
  const project = await mongoose.model('Project').findById(this.project).populate('tasks');
  if (!project) return next();

  const remainingTasks = project.tasks.filter(task => task._id.toString() !== this._id.toString());
  if (remainingTasks.length === 0) {
    project.status = 'planned';
  } else if (remainingTasks.some(task => task.status === 'in_progress')) {
    project.status = 'in_progress';
  } else {
    project.status = 'planned';
  }

  await project.save();
  next();
});

module.exports = mongoose.model('Task', taskSchema);