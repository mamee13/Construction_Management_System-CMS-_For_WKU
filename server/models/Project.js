

const mongoose = require('mongoose');

// Assuming User model exists and has an 'associatedProjects' array field

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

// --- REMOVED pre('remove') Hook ---
// Cascade delete is now handled manually in the controller

// --- Post-Save Middleware ---
// Remains useful for updating user associations on project create/update
projectSchema.post('save', async function(doc, next) {
    const needsUpdate = this.isNew || this.isModified('contractor') || this.isModified('consultant') || this.isModified('projectManager');
    if (!needsUpdate) {
        return next();
    }
    console.log(`[Project Post-Save Hook ${doc._id}] Updating associated projects for users.`);
    try {
        const User = mongoose.model('User');
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
        // Example for contractor removal (if needed):
        // if (!this.isNew && this.isModified('contractor') && !doc.contractor) {
        //    const original = await this.constructor.findById(this._id).select('contractor'); // Fetch previous state might be needed or use different hook
        //    const oldContractorId = this.getOldValue('contractor'); // Hypothetical function, Mongoose doesn't easily provide old value here
        //    // Need a way to get the old ID to remove project from that user
        //    // This highlights complexity, better handled via dedicated user management routes or different hook strategy if needed.
        // }


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
// Indexes for Performance
// ==============================================
projectSchema.index({ projectName: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ contractor: 1 });
projectSchema.index({ consultant: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);