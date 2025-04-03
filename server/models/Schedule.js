



// models/Schedule.js
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
        // Ensure 'this' context refers to the document being validated
        if (!this.startDate) return true; // Allow validation if startDate isn't set yet
        return value >= this.startDate;
      },
      message: 'End date must be on or after the start date' // Changed message slightly for clarity
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
  // --- ADDED FIELD ---
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator user is required'], // Ensure it's always set
    immutable: true // Typically, the creator shouldn't change
  },
  // --- END ADDED FIELD ---
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
  // createdAt is handled by timestamps: true
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for schedule duration
scheduleSchema.virtual('duration').get(function() {
  if (!this.endDate || !this.startDate) return null; // Handle missing dates
  // Ensure dates are valid before calculation
  if (this.endDate instanceof Date && this.startDate instanceof Date && !isNaN(this.endDate) && !isNaN(this.startDate)) {
       return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)); // Duration in days
  }
  return null; // Return null if dates are invalid
});


// Indexes for performance
scheduleSchema.index({ scheduleName: 1, status: 1 });
scheduleSchema.index({ project: 1 });
scheduleSchema.index({ task: 1 });
scheduleSchema.index({ assignedTo: 1 });
scheduleSchema.index({ createdBy: 1 }); // Index the new field

// --- Middleware (Hooks) ---

// Pre-save: Validate dates against task/project AND ensure endDate >= startDate
scheduleSchema.pre('validate', function(next) {
    // Ensure end date is not before start date
    if (this.endDate && this.startDate && this.endDate < this.startDate) {
        this.invalidate('endDate', 'End date must be on or after the start date.', this.endDate);
    }
    next();
});


scheduleSchema.pre('save', async function(next) {
  // Fetch related docs only if task or project is potentially modified or on initial save
  if (this.isModified('task') || this.isModified('project') || this.isNew) {
      try {
          // Use Promise.all for potentially faster lookups
          const [task, project] = await Promise.all([
              this.task ? mongoose.model('Task').findById(this.task).lean() : null, // Use lean for read-only
              this.project ? mongoose.model('Project').findById(this.project).lean() : null
          ]);

          if (!task) {
              return next(new Error('Associated task not found'));
          }
          if (!project) {
              return next(new Error('Associated project not found'));
          }

          // Convert string dates from model/updates to Date objects if needed
          const scheduleStartDate = new Date(this.startDate);
          const scheduleEndDate = new Date(this.endDate);
          const taskStartDate = task.startDate ? new Date(task.startDate) : null;
          const taskEndDate = task.endDate ? new Date(task.endDate) : null;
          const projectStartDate = project.startDate ? new Date(project.startDate) : null;
          const projectEndDate = project.endDate ? new Date(project.endDate) : null;


          // Perform date comparisons safely
          if (taskStartDate && scheduleStartDate < taskStartDate) {
               return next(new Error('Schedule start date cannot be before the task start date.'));
          }
           if (taskEndDate && scheduleEndDate > taskEndDate) {
               return next(new Error('Schedule end date cannot be after the task end date.'));
           }
           if (projectStartDate && scheduleStartDate < projectStartDate) {
              return next(new Error('Schedule start date cannot be before the project start date.'));
           }
           if (projectEndDate && scheduleEndDate > projectEndDate) {
              return next(new Error('Schedule end date cannot be after the project end date.'));
           }

      } catch (error) {
          console.error("Error during pre-save date validation:", error);
          return next(error); // Pass error to Mongoose
      }
  }
  next();
});


// Post-save: Update project's schedule list and potentially task status
scheduleSchema.post('save', async function(doc, next) {
  // Run these operations in parallel if possible
  try {
      await Promise.all([
          // Add schedule to project
          mongoose.model('Project').findByIdAndUpdate(
              doc.project,
              { $addToSet: { schedules: doc._id } }
          ),
          // Update task status if needed
          (async () => { // IIFE to handle async logic within Promise.all
              if (doc.status === 'completed') {
                  const task = await mongoose.model('Task').findById(doc.task);
                  if (task && task.status !== 'completed') {
                      task.status = 'completed';
                      await task.save();
                      console.log(`[Schedule Post-Save Hook] Updated task ${task._id} status to completed.`);
                  }
              }
          })()
      ]);
      console.log(`[Schedule Post-Save Hook] Processed post-save for schedule ${doc._id}`);
  } catch (error) {
      console.error(`[Schedule Post-Save Hook] Error processing post-save for schedule ${doc._id}:`, error);
      // Decide if this error should halt the operation. next(error) would.
      // If it's non-critical logging, maybe don't call next(error).
  }
  next(); // Call next even if secondary updates fail, unless critical
});


// Pre-remove: Clean up project array and potentially revert task status
scheduleSchema.pre('remove', async function(next) {
  console.log(`[Schedule Pre-Remove Hook] Processing pre-remove for schedule ${this._id}`);
  try {
       await Promise.all([
           // Remove schedule from project
           mongoose.model('Project').findByIdAndUpdate(
               this.project,
               { $pull: { schedules: this._id } }
           ),
           // Update task status if needed (revert from completed?)
           (async () => { // IIFE
               const task = await mongoose.model('Task').findById(this.task);
               // Revert task status ONLY if this was the *last* completing schedule?
               // Simple logic: if task was completed, maybe revert it. Needs business rule refinement.
               if (task && task.status === 'completed') {
                   // Consider checking if other 'completed' schedules exist for this task before reverting
                   task.status = 'in_progress'; // Or 'planned'? Depends on logic.
                   await task.save();
                   console.log(`[Schedule Pre-Remove Hook] Reverted task ${task._id} status.`);
               }
           })()
       ]);
        console.log(`[Schedule Pre-Remove Hook] Successfully processed pre-remove for schedule ${this._id}`);

   } catch (error) {
        console.error(`[Schedule Pre-Remove Hook] Error processing pre-remove for schedule ${this._id}:`, error);
        // If cleanup fails, should the deletion be stopped? next(error) stops it.
        return next(error); // Stop deletion if cleanup fails
   }
   next(); // Proceed with deletion
});


module.exports = mongoose.model('Schedule', scheduleSchema);