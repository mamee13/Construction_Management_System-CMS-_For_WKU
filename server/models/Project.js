



const mongoose = require('mongoose');

// --- ADDED: Import ONLY the Report model needed for cascade delete ---
const Report = require('./Report');     // Assuming Report.js is in the same directory
// Assuming User model exists and has an 'associatedProjects' array field
// const User = mongoose.model('User'); // User model might already be imported or handled differently

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
        const checkStartDate = this.startDate || this.getUpdate?.$set?.startDate;
        if (value instanceof Date && checkStartDate instanceof Date) {
            return value > checkStartDate;
        }
        // If updating only endDate, need to fetch startDate from DB - this validator might be insufficient alone
        // Consider fetching the document first in update route if strict validation is needed across separate updates
        return !checkStartDate || (value instanceof Date && checkStartDate instanceof Date && value > checkStartDate);
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
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a project manager to the project']
  },
  // --- References to related documents ---
  // These arrays mainly serve for population, deletion is handled differently now
  materials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  schedules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'on_hold', 'cancelled'],
    default: 'planned'
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for project duration (in days)
projectSchema.virtual('duration').get(function() {
  if (this.endDate && this.startDate && this.endDate instanceof Date && this.startDate instanceof Date) {
      const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
  }
  return null;
});

// ==============================================
// Middleware Hooks
// ==============================================

// --- ADDED: Middleware for Cascade Delete (REPORTS ONLY) ---
// IMPORTANT: Use 'function' keyword for middleware to correctly bind 'this'.

// Middleware hook before a Project document's 'remove()' method is called
projectSchema.pre('remove', async function(next) {
  console.log(`[Project Pre-Remove Hook ${this._id}] Project is being removed. Deleting associated reports...`);
  try {
    // 'this' refers to the project document being removed
    const projectId = this._id;
    await Report.deleteMany({ project: projectId }); // DELETE ONLY REPORTS

    console.log(`[Project Pre-Remove Hook ${this._id}] Cascade delete for reports successful.`);
    next(); // Continue with the project removal
  } catch (error) {
    console.error(`[Project Pre-Remove Hook ${this._id}] Error during report cascade delete:`, error);
    next(error); // Pass the error to stop the removal process
  }
});

// Middleware hook before 'findOneAndDelete' or 'findByIdAndDelete' is executed
projectSchema.pre('findOneAndDelete', async function(next) {
  // 'this.getQuery()' retrieves the query conditions used for findOneAndDelete
  const query = this.getQuery();
  const projectId = query._id; // Get the ID from the query

  if (projectId) {
    console.log(`[Project Pre-FindOneAndDelete Hook ${projectId}] Project is being deleted. Deleting associated reports...`);
    try {
      await Report.deleteMany({ project: projectId }); // DELETE ONLY REPORTS

      console.log(`[Project Pre-FindOneAndDelete Hook ${projectId}] Cascade delete for reports successful.`);
      next();
    } catch (error) {
      console.error(`[Project Pre-FindOneAndDelete Hook ${projectId}] Error during report cascade delete:`, error);
      next(error);
    }
  } else {
    console.warn('[Project Pre-FindOneAndDelete Hook] Middleware triggered without _id in query:', query);
    next(); // Proceed cautiously if no ID found
  }
});

// Middleware hook before 'deleteMany' is executed
projectSchema.pre('deleteMany', async function(next) {
    // 'this.getFilter()' retrieves the query conditions
    const filter = this.getFilter();
    console.log('[Project Pre-DeleteMany Hook] Triggered for Projects with filter:', filter);

    try {
        // Find the IDs of the projects that *will* be deleted by this operation
        const projectsToDelete = await mongoose.model('Project').find(filter).select('_id').lean();
        const projectIds = projectsToDelete.map(p => p._id);

        if (projectIds.length > 0) {
            console.log(`[Project Pre-DeleteMany Hook] Projects [${projectIds.join(', ')}] are being deleted. Deleting associated reports...`);

            await Report.deleteMany({ project: { $in: projectIds } }); // DELETE ONLY REPORTS

            console.log(`[Project Pre-DeleteMany Hook] Cascade delete for reports successful (multiple projects).`);
        } else {
             console.log(`[Project Pre-DeleteMany Hook] No projects matched the filter for deletion.`);
        }
        next();
    } catch (error) {
        console.error(`[Project Pre-DeleteMany Hook] Error during report cascade delete (multiple projects):`, error);
        next(error);
    }
});
// --- END: Added Middleware for Cascade Delete ---


// --- Post-Save Middleware (Existing - Unchanged) ---
// Remains useful for updating user associations on project create/update
projectSchema.post('save', async function(doc, next) {
    const needsUpdate = this.isNew || this.isModified('contractor') || this.isModified('consultant') || this.isModified('projectManager');
    if (!needsUpdate) {
        return next();
    }
    console.log(`[Project Post-Save Hook ${doc._id}] Updating associated projects for users.`);
    try {
        const User = mongoose.model('User'); // Make sure User model is accessible
        const updatePromises = [];

        // Use $addToSet to add project ID to user's associatedProjects array
        if (doc.contractor && (this.isNew || this.isModified('contractor'))) {
             console.log(`[Project Post-Save Hook ${doc._id}] Adding project to contractor ${doc.contractor}`);
            updatePromises.push(User.findByIdAndUpdate(doc.contractor, { $addToSet: { associatedProjects: doc._id } }).exec());
        }
        if (doc.consultant && (this.isNew || this.isModified('consultant'))) {
             console.log(`[Project Post-Save Hook ${doc._id}] Adding project to consultant ${doc.consultant}`);
            updatePromises.push(User.findByIdAndUpdate(doc.consultant, { $addToSet: { associatedProjects: doc._id } }).exec());
        }
        if (doc.projectManager && (this.isNew || this.isModified('projectManager'))) {
            console.log(`[Project Post-Save Hook ${doc._id}] Adding project to projectManager ${doc.projectManager}`);
           updatePromises.push(User.findByIdAndUpdate(doc.projectManager, { $addToSet: { associatedProjects: doc._id } }).exec());
       }

        // Handle removal if a user field was changed FROM a value TO null/undefined (more complex, omitted for brevity focus on creation/addition)
        // ... (existing comment block remains)

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            console.log(`[Project Post-Save Hook ${doc._id}] Successfully processed user updates.`);
        } else {
             console.log(`[Project Post-Save Hook ${doc._id}] No user updates needed or processed.`);
        }
        next();
    } catch (error) {
        console.error(`[Project Post-Save Hook ${doc._id}] Error updating users:`, error);
        next(error);
    }
});

// ==============================================
// Indexes for Performance (Existing - Unchanged)
// ==============================================
projectSchema.index({ projectName: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ contractor: 1 });
projectSchema.index({ consultant: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);