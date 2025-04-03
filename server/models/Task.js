

// src/models/Task.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Use Schema alias for consistency

const taskSchema = new Schema({
  taskName: {
    type: String,
    required: [true, 'Please provide the task name'],
    trim: true,
    maxlength: [100, 'Task name cannot exceed 100 characters']
  },
  taskDescription: {
    type: String,
    // Consider if this should truly be required or optional
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
  //   validate: [ // Simplified array syntax for validator
  //     {
  //       validator: function(value) {
  //         // Always compare against startDate available on the document context
  //         // Note: this.getUpdate() only works reliably in specific update middleware, not basic validation
  //         return value >= this.startDate;
  //       },
  //       message: 'start  date must be befor  the end  date'
  //     },
  //     // Add the project date validation here as well if preferred over pre-save hook
  //     // {
  //     //   validator: async function(value) {
  //     //       const project = await mongoose.model('Project').findById(this.project).select('endDate');
  //     //       return !project || value <= project.endDate;
  //     //   },
  //     //   message: 'Task end date cannot be after the project end date'
  //     // }
  //   ]
  // },
  endDate: {
    type: Date,
    required: [true, 'Please provide the end date'],
    validate: [
      {
        validator: function (value) {
          // In update operations, check for updated startDate
          if (this.getUpdate && this.getUpdate().$set && this.getUpdate().$set.startDate) {
            return value >= this.getUpdate().$set.startDate;
          }
          // In normal save, use the document's startDate
          return value >= this.startDate;
        },
        message: 'End date must be on or after the start date'
      }
    ]
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign the task to at least one user'],
    //select: false
  }],
  project: {
    type: Schema.Types.ObjectId,
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

  // --- FIELD ADDED HERE ---
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Link to the User model
    required: [true, 'Task creator is required'], // Ensure creator is tracked
    // index: true // Optional: Index if you frequently query tasks by creator
  }
  // --- END OF ADDED FIELD ---

  // Note: `createdAt` is handled automatically by `timestamps: true` below, no need to define explicitly
  // createdAt: {
  //   type: Date,
  //   default: Date.now
  // }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true }, // Ensure virtuals are included in JSON output
  toObject: { virtuals: true } // Ensure virtuals are included when converting to object
});

// --- Virtuals ---
taskSchema.virtual('duration').get(function() {
  if (!this.endDate || !this.startDate) return null; // Handle missing dates
  // Calculate difference in milliseconds and convert to days
  const duration = Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
  return duration >= 0 ? duration : null; // Return null if end date is before start date (should be caught by validation)
});

// --- Indexes ---
taskSchema.index({ project: 1, status: 1 }); // Compound index for filtering by project and status
taskSchema.index({ assignedTo: 1 }); // Index for finding tasks assigned to a user
taskSchema.index({ endDate: 1 }); // Index for querying by end date

// --- Middleware ---

// Merged pre-save middleware: Validate dates against project and ensure endDate > startDate
// taskSchema.pre('save', async function(next) {
//   console.log(`[Task Pre-Save Hook] Validating task ${this.isNew ? 'NEW' : this._id}...`);

//   // 1. Ensure endDate > startDate (Schema validator might handle this, but double-check)
//   if (this.endDate && this.startDate && this.endDate <= this.startDate) {
//      console.error(`[Task Pre-Save Hook] Validation Error: End date ${this.endDate} not after start date ${this.startDate}`);
//      return next(new Error('End date must be strictly after the start date'));
//   }

//   // 2. Validate task dates against project dates
//   if (this.project) { // Only run if project is set
//     try {
//       // Select only the necessary fields from the project
//       const project = await mongoose.model('Project').findById(this.project).select('startDate endDate');
//       if (!project) {
//         // This case should ideally be caught in the controller before attempting save
//          console.error(`[Task Pre-Save Hook] Validation Error: Project ${this.project} not found.`);
//         return next(new Error(`Associated project (${this.project}) not found.`));
//       }

//       // Check Start Date
//       if (project.startDate && this.startDate < project.startDate) {
//          console.error(`[Task Pre-Save Hook] Validation Error: Task start date ${this.startDate} is before project start date ${project.startDate}`);
//         return next(new Error(`Task start date (${this.startDate.toDateString()}) cannot be earlier than the project start date (${project.startDate.toDateString()}).`));
//       }
//       // Check End Date
//       if (project.endDate && this.endDate > project.endDate) {
//         console.error(`[Task Pre-Save Hook] Validation Error: Task end date ${this.endDate} is after project end date ${project.endDate}`);
//         return next(new Error(`Task end date (${this.endDate.toDateString()}) cannot be later than the project end date (${project.endDate.toDateString()}).`));
//       }
//        console.log(`[Task Pre-Save Hook] Task dates are within project date boundaries.`);

//     } catch (error) {
//       console.error(`[Task Pre-Save Hook] Error fetching project ${this.project} for date validation:`, error);
//       return next(error); // Pass DB errors etc. along
//     }
//   }

//   next(); // All checks passed
// });

taskSchema.pre('save', async function(next) {
  console.log(`[Task Pre-Save Hook] Validating task ${this.isNew ? 'NEW' : this._id}...`);

  // 1. Ensure endDate >= startDate
  // --- CHANGE HERE: Allow same day ---
  if (this.endDate && this.startDate && this.endDate < this.startDate) { // Use < instead of <=
     console.error(`[Task Pre-Save Hook] Validation Error: End date ${this.endDate} is before start date ${this.startDate}`);
     // --- UPDATE MESSAGE ---
     return next(new Error('End date cannot be before the start date'));
  }

  // 2. Validate task dates against project dates (Keep this logic as is)
  if (this.project) {
    try {
      const project = await mongoose.model('Project').findById(this.project).select('startDate endDate');
      if (!project) {
        // ... handle project not found ...
        return next(new Error(`Associated project (${this.project}) not found.`));
      }
      if (project.startDate && this.startDate < project.startDate) {
        // ... handle task start before project start ...
        return next(new Error(`Task start date (${this.startDate.toDateString()}) cannot be earlier than the project start date (${project.startDate.toDateString()}).`));
      }
      if (project.endDate && this.endDate > project.endDate) {
        // ... handle task end after project end ...
        return next(new Error(`Task end date (${this.endDate.toDateString()}) cannot be later than the project end date (${project.endDate.toDateString()}).`));
      }
       console.log(`[Task Pre-Save Hook] Task dates are within project date boundaries.`);
    } catch (error) {
      // ... handle project fetch error ...
      return next(error);
    }
  }

  next(); // All checks passed
});

// Merged post-save middleware: Add task to project array AND update project status
taskSchema.post('save', async function(doc, next) {
  // `doc` is the task document that was just saved
  console.log(`[Task Post-Save Hook] Processing after saving task ${doc._id}`);
  if (!doc.project) {
      console.warn(`[Task Post-Save Hook] Task ${doc._id} has no project associated, skipping project updates.`);
      return next();
  }

  try {
    const Project = mongoose.model('Project');

    // 1. Add task ID to the project's 'tasks' array (using $addToSet for idempotency)
    const updateResult = await Project.findByIdAndUpdate(
      doc.project,
      { $addToSet: { tasks: doc._id } },
      { new: false } // We don't necessarily need the updated project doc here yet
    );

    if (!updateResult) {
        console.error(`[Task Post-Save Hook] Project ${doc.project} not found when trying to add task reference ${doc._id}.`);
        // Decide if this is a critical error. The task exists, but the link failed.
        // Maybe log it and continue, or return an error? Let's log and continue for now.
    } else {
         console.log(`[Task Post-Save Hook] Task ${doc._id} reference added/ensured in project ${doc.project}.`);
    }


    // 2. Recalculate and potentially update the project's status
    // Fetch the project AGAIN, this time populating the tasks to get their statuses
    const project = await Project.findById(doc.project).populate({
        path: 'tasks',
        select: 'status' // Only select the status field from tasks for efficiency
    });

    if (!project) {
        console.error(`[Task Post-Save Hook] Project ${doc.project} not found for status update after adding task ${doc._id}.`);
        return next(); // Can't update status if project doesn't exist
    }

    const tasks = project.tasks;
    let newProjectStatus = project.status; // Start with current status

    if (!tasks || tasks.length === 0) {
        newProjectStatus = 'planned'; // Or 'not_started'? Depends on your desired logic
    } else {
        const allTasksCompleted = tasks.every(task => task.status === 'completed');
        const anyTaskInProgress = tasks.some(task => task.status === 'in_progress');
        const anyTaskNotStarted = tasks.some(task => task.status === 'not_started');

        if (allTasksCompleted) {
            newProjectStatus = 'completed';
        } else if (anyTaskInProgress || (anyTaskNotStarted && !tasks.some(t => t.status === 'on_hold'))) {
             // If any task is in progress, or if there are 'not started' tasks and none 'on hold'
            newProjectStatus = 'in_progress';
        } else if (tasks.every(task => task.status === 'on_hold' || task.status === 'completed')) {
             newProjectStatus = 'on_hold'; // If only completed or on_hold tasks remain
        } else {
             newProjectStatus = 'planned'; // Default if none of the above
        }
    }


    // Only save the project if the status actually needs changing
    if (newProjectStatus !== project.status) {
        project.status = newProjectStatus;
        await project.save();
        console.log(`[Task Post-Save Hook] Updated project ${project._id} status to: ${newProjectStatus}`);
    } else {
         console.log(`[Task Post-Save Hook] Project ${project._id} status (${project.status}) did not need update.`);
    }

    next(); // Proceed after all post-save logic is done

  } catch (error) {
    console.error(`[Task Post-Save Hook] Error processing post-save for task ${doc._id} / project ${doc.project}:`, error);
    next(error); // Pass error to Mongoose error handling
  }
});


// Merged pre-remove middleware: Remove task reference from project AND update project status
// Note: 'remove' middleware executes when you call document.remove(), NOT findByIdAndDelete() etc.
// If using findByIdAndDelete in controller, this hook won't run. Consider adding logic there or switching to document.remove().
taskSchema.pre('remove', { document: true, query: false }, async function(next) {
    // `this` refers to the task document being removed
    console.log(`[Task Pre-Remove Hook] Processing before removing task ${this._id}`);
    if (!this.project) {
        console.warn(`[Task Pre-Remove Hook] Task ${this._id} has no project associated, skipping project updates.`);
        return next();
    }

    const projectId = this.project;
    const taskIdToRemove = this._id;

    try {
        const Project = mongoose.model('Project');

        // 1. Remove task reference from the project using $pull
        const projectUpdateResult = await Project.findByIdAndUpdate(
            projectId,
            { $pull: { tasks: taskIdToRemove } },
            { new: true } // Get the updated project document back
        ).populate({
            path: 'tasks', // Populate the *remaining* tasks
            select: 'status' // Select only status
        });

         if (!projectUpdateResult) {
             console.error(`[Task Pre-Remove Hook] Project ${projectId} not found when trying to remove task reference ${taskIdToRemove}.`);
             // Log and continue, as the task will still be removed.
         } else {
              console.log(`[Task Pre-Remove Hook] Task ${taskIdToRemove} reference removed from project ${projectId}.`);
         }

        // 2. Recalculate and potentially update the project's status (using the updated project doc)
        const project = projectUpdateResult; // The project doc *after* the task was removed
        if (project) { // Check if we got the project back
             const tasks = project.tasks; // Remaining tasks
             let newProjectStatus = project.status;

             if (!tasks || tasks.length === 0) {
                 newProjectStatus = 'planned';
             } else {
                 const allTasksCompleted = tasks.every(task => task.status === 'completed');
                 const anyTaskInProgress = tasks.some(task => task.status === 'in_progress');

                 if (allTasksCompleted) {
                     newProjectStatus = 'completed';
                 } else if (anyTaskInProgress) {
                     newProjectStatus = 'in_progress';
                 } else {
                      // If no tasks are in progress and not all are completed, maybe 'planned' or 'on_hold'
                      // depending on remaining statuses
                     if (tasks.every(task => task.status === 'on_hold' || task.status === 'completed')) {
                          newProjectStatus = 'on_hold';
                     } else {
                          newProjectStatus = 'planned'; // Or 'not_started'?
                     }
                 }
             }

             if (newProjectStatus !== project.status) {
                 project.status = newProjectStatus;
                 await project.save(); // Save the project with the potentially updated status
                 console.log(`[Task Pre-Remove Hook] Updated project ${project._id} status to: ${newProjectStatus} after task removal.`);
             } else {
                  console.log(`[Task Pre-Remove Hook] Project ${project._id} status (${project.status}) did not need update after task removal.`);
             }
        }

        next(); // Proceed with the actual task removal

    } catch (error) {
        console.error(`[Task Pre-Remove Hook] Error processing pre-remove for task ${this._id} / project ${projectId}:`, error);
        next(error); // Pass error along
    }
});


module.exports = mongoose.model('Task', taskSchema);