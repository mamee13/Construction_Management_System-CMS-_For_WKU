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
  // endDate: {
  //   type: Date,
  //   required: [true, 'Please provide the end date'],
  //   validate: {
  //     validator: function(value) {
  //       return value > this.startDate;
  //     },
  //     message: 'End date must be after the start date'
  //   }
  // },
  endDate: {
    type: Date,
    required: [true, 'Please provide the end date'],
    validate: {
      validator: function(value) {
        // If the document is new (creating), use `this.startDate`
        // Otherwise, for updates, use `this.getUpdate().$set.startDate`
        if (this.isNew) {
          return value > this.startDate;
        } else {
          return !this.getUpdate || !this.getUpdate().$set.startDate || value > this.getUpdate().$set.startDate;
        }
      },
      message: 'End date must be after the start date'
    }
  },
  // assignedTo: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: [true, 'Please assign the task to a user']
  // },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign the task to at least one user']
  }],
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

// Add this post-save hook to taskSchema

taskSchema.post('save', async function(doc, next) {
  // Note: Your existing post-save hook updates the Project status. Keep that!
  console.log(`[Task Post-Save Hook] Adding task ${doc._id} to project ${doc.project}`);
  try {
    // Update the Project's tasks array
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(
      doc.project,
      { $addToSet: { tasks: doc._id } }
    );
    console.log(`[Task Post-Save Hook] Successfully added task ${doc._id} to project ${doc.project}`);

    // --- Keep your existing logic to update the Project status ---
    // Note: It might be slightly more efficient to fetch the project once
    const project = await Project.findById(doc.project).populate('tasks'); // Populate tasks here
    if (!project) {
        console.error(`[Task Post-Save Hook] Project ${doc.project} not found for status update.`);
        return next(); // Or next(new Error(...))
    }

    const allTasksCompleted = project.tasks.every(task => task.status === 'completed');
    if (allTasksCompleted && project.status !== 'completed') {
        project.status = 'completed';
        await project.save();
        console.log(`[Task Post-Save Hook] Updated project ${project._id} status to completed.`);
    } else if (!allTasksCompleted && project.status === 'completed') {
        // Optional: If a task is added/updated and makes the project incomplete again
        project.status = 'in_progress'; // Or based on other tasks' statuses
        await project.save();
         console.log(`[Task Post-Save Hook] Reverted project ${project._id} status as not all tasks are completed.`);
    }
    // --- End of existing logic ---

    next();
  } catch (error) {
    console.error(`[Task Post-Save Hook] Error processing post-save for task ${doc._id}:`, error);
    next(error);
  }
});


// Add a pre-remove hook to clean up the project array if a task is deleted directly
taskSchema.pre('remove', async function(next) {
     // Note: Your existing pre-remove hook updates the Project status. Keep that!
     console.log(`[Task Pre-Remove Hook] Removing task ${this._id} from project ${this.project}`);
    try {
        const Project = mongoose.model('Project');
        // Update the Project's tasks array
        // Use $pull inside findByIdAndUpdate for atomicity
        const project = await Project.findByIdAndUpdate(
            this.project,
            { $pull: { tasks: this._id } },
            { new: true } // Get the updated project document back
        ).populate('tasks'); // Repopulate tasks after the pull

        console.log(`[Task Pre-Remove Hook] Successfully removed task ${this._id} from project ${this.project}`);

        // --- Keep/Adapt your existing logic to update the Project status ---
        if (!project) {
            console.error(`[Task Pre-Remove Hook] Project ${this.project} not found for status update.`);
            return next();
        }

        // Check status based on remaining tasks
        const remainingTasks = project.tasks; // tasks array is already updated due to $pull and {new: true}
        if (remainingTasks.length === 0 && project.status !== 'planned') {
            project.status = 'planned';
            await project.save();
            console.log(`[Task Pre-Remove Hook] Updated project ${project._id} status to planned (no tasks left).`);
        } else if (remainingTasks.length > 0 && remainingTasks.every(task => task.status === 'completed') && project.status !== 'completed') {
             project.status = 'completed';
             await project.save();
             console.log(`[Task Pre-Remove Hook] Updated project ${project._id} status to completed (all remaining tasks done).`);
        } else if (remainingTasks.some(task => task.status === 'in_progress') && project.status !== 'in_progress') {
            project.status = 'in_progress';
            await project.save();
             console.log(`[Task Pre-Remove Hook] Updated project ${project._id} status to in_progress.`);
        }
        // Add more conditions if needed (e.g., back to planned if only 'not_started' tasks remain)
        // --- End of existing logic ---

        next();
    } catch (error) {
        console.error(`[Task Pre-Remove Hook] Error processing pre-remove for task ${this._id}:`, error);
        next(error);
    }
});


module.exports = mongoose.model('Task', taskSchema);