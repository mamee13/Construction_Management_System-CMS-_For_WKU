

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
        return value >= this.startDate;
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

// Add this post-save hook to scheduleSchema

scheduleSchema.post('save', async function(doc, next) {
  // Note: Your existing post-save hook updates the Task. Keep that!
  // We'll add the project update logic alongside it.

  console.log(`[Schedule Post-Save Hook] Adding schedule ${doc._id} to project ${doc.project}`);
  try {
    // Update the Project
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(
      doc.project,
      { $addToSet: { schedules: doc._id } }
    );
    console.log(`[Schedule Post-Save Hook] Successfully added schedule ${doc._id} to project ${doc.project}`);

    // --- Keep your existing logic to update the Task ---
    const Task = mongoose.model('Task');
    const task = await Task.findById(doc.task);
    if (task && doc.status === 'completed' && task.status !== 'completed') {
        task.status = 'completed';
        await task.save();
        console.log(`[Schedule Post-Save Hook] Updated task ${task._id} status to completed.`);
    }
    // --- End of existing logic ---

    next();
  } catch (error) {
    console.error(`[Schedule Post-Save Hook] Error processing post-save for schedule ${doc._id}:`, error);
    next(error);
  }
});


// Add a pre-remove hook to clean up the project array if a schedule is deleted directly
scheduleSchema.pre('remove', async function(next) {
    // Note: Your existing pre-remove hook updates the Task. Keep that!
    console.log(`[Schedule Pre-Remove Hook] Removing schedule ${this._id} from project ${this.project}`);
    try {
        // Update the Project
        const Project = mongoose.model('Project');
        await Project.findByIdAndUpdate(
            this.project,
            { $pull: { schedules: this._id } } // Remove the schedule's ID
        );
        console.log(`[Schedule Pre-Remove Hook] Successfully removed schedule ${this._id} from project ${this.project}`);

        // --- Keep your existing logic to update the Task ---
        const Task = mongoose.model('Task');
        const task = await Task.findById(this.task);
        if (task && task.status === 'completed') {
            // Maybe revert task status if the schedule was critical? Or leave as is?
            // This depends on your business logic. Let's assume reverting for now.
            task.status = 'in_progress'; // Or 'not_started' depending on logic
            await task.save();
             console.log(`[Schedule Pre-Remove Hook] Reverted task ${task._id} status.`);
        }
         // --- End of existing logic ---

        next();
    } catch (error) {
        console.error(`[Schedule Pre-Remove Hook] Error processing pre-remove for schedule ${this._id}:`, error);
        next(error);
    }
});

module.exports = mongoose.model('Schedule', scheduleSchema);