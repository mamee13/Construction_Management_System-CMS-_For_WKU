
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
        // Handles both creation and update scenarios
        const checkStartDate = this.startDate || this.getUpdate?.$set?.startDate;
        return !checkStartDate || value > checkStartDate;
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
  // --- References to related documents ---
  materials: [{ // This stores IDs, but deletion is handled by pre-remove hook
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  schedules: [{ // This stores IDs, but deletion is handled by pre-remove hook
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  }],
  tasks: [{ // This stores IDs, but deletion is handled by pre-remove hook
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  comments: [{ // This stores IDs, but deletion is handled by pre-remove hook
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
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true }, // Include virtuals when document is converted to JSON
  toObject: { virtuals: true } // Include virtuals when document is converted to a plain object
});

// Virtual for project duration (in days)
projectSchema.virtual('duration').get(function() {
  if (this.endDate && this.startDate) {
      return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return 0; // Return 0 or null if dates are missing
});

// ==============================================
// Middleware Hooks
// ==============================================

// --- Cascade Delete Middleware ---
// Runs BEFORE a project document is removed using document.remove()
projectSchema.pre('remove', async function(next) {
  const projectId = this._id;
  console.log(`[Project Pre-Remove Hook ${projectId}] ---> ENTERING hook.`);

  try {
      // --- Log Model Access ---
      console.log(`[Project Pre-Remove Hook ${projectId}] Accessing Material model...`);
      const Material = this.model('Material');
      if (!Material) throw new Error("Failed to get Material model"); // Add checks
      console.log(`[Project Pre-Remove Hook ${projectId}] Got Material model.`);

      console.log(`[Project Pre-Remove Hook ${projectId}] Accessing Schedule model...`);
      const Schedule = this.model('Schedule');
      if (!Schedule) throw new Error("Failed to get Schedule model");
      console.log(`[Project Pre-Remove Hook ${projectId}] Got Schedule model.`);

      console.log(`[Project Pre-Remove Hook ${projectId}] Accessing Comment model...`);
      const Comment = this.model('Comment');
       if (!Comment) throw new Error("Failed to get Comment model");
      console.log(`[Project Pre-Remove Hook ${projectId}] Got Comment model.`);

      console.log(`[Project Pre-Remove Hook ${projectId}] Accessing Task model...`);
      const Task = this.model('Task');
      if (!Task) throw new Error("Failed to get Task model");
      console.log(`[Project Pre-Remove Hook ${projectId}] Got Task model.`);

      console.log(`[Project Pre-Remove Hook ${projectId}] Accessing User model...`);
      const User = this.model('User');
      if (!User) throw new Error("Failed to get User model");
      console.log(`[Project Pre-Remove Hook ${projectId}] Got User model.`);
      // --- End Log Model Access ---


      console.log(`[Project Pre-Remove Hook ${projectId}] Starting Promise.all...`);

      const results = await Promise.all([
          Material.deleteMany({ project: projectId }).exec(),
          Schedule.deleteMany({ project: projectId }).exec(),
          Comment.deleteMany({ project: projectId }).exec(),
          Task.deleteMany({ project: projectId }).exec(),
          this.contractor ? User.findByIdAndUpdate(this.contractor, { $pull: { associatedProjects: projectId } }).exec() : Promise.resolve({ message: "No contractor" }),
          this.consultant ? User.findByIdAndUpdate(this.consultant, { $pull: { associatedProjects: projectId } }).exec() : Promise.resolve({ message: "No consultant" })
      ]);

      console.log(`[Project Pre-Remove Hook ${projectId}] Promise.all COMPLETED.`);
      // Log results if needed...

      console.log(`[Project Pre-Remove Hook ${projectId}] ---> Calling next() successfully.`);
      next();

  } catch (error) {
      console.error(`[Project Pre-Remove Hook ${projectId}] ---> CAUGHT ERROR:`, error);
      console.log(`[Project Pre-Remove Hook ${projectId}] ---> Calling next(error) due to error.`);
      next(error);
  }
});

// projectSchema.pre('remove', async function(next) {
//   console.log(`[Project Pre-Remove Hook] Deleting related documents for project ${this._id}`);
//   try {
//       // Concurrently delete all related documents
//       await Promise.all([
//           // Use this.model('ModelName') to access other models within the hook
//           this.model('Material').deleteMany({ project: this._id }),
//           this.model('Schedule').deleteMany({ project: this._id }),
//           this.model('Comment').deleteMany({ project: this._id }),
//           this.model('Task').deleteMany({ project: this._id }) // <-- Added Task deletion
//       ]);
//       console.log(`[Project Pre-Remove Hook] Successfully deleted related documents for project ${this._id}`);
//       next(); // Proceed with removing the project itself
//   } catch (error) {
//       console.error(`[Project Pre-Remove Hook] Error deleting related documents for project ${this._id}:`, error);
//       // Pass error to Mongoose to potentially halt the remove operation
//       next(error);
//   }
// });

// --- Post-Save Middleware ---
// After a project is saved (created or updated), update associated users.
projectSchema.post('save', async function(doc, next) {
  // Check if contractor or consultant fields were modified or if it's a new doc
  // This check prevents unnecessary updates on every save if these fields didn't change.
  // Note: isModified might not work perfectly for ObjectId comparison, checking isNew is safer for creation.
  const needsUpdate = this.isNew || this.isModified('contractor') || this.isModified('consultant');

  if (!needsUpdate) {
      return next(); // Skip if contractor/consultant haven't changed
  }

  console.log(`[Project Post-Save Hook] Updating associated projects for users related to project ${doc._id}`);
  try {
    // Inline require of the User model to prevent potential circular dependencies
    const User = mongoose.model('User');

    // Use Promise.all for concurrent updates
    await Promise.all([
        // Add project ID to contractor's list (using $addToSet prevents duplicates)
        User.findByIdAndUpdate(
            doc.contractor,
            { $addToSet: { associatedProjects: doc._id } }
            // { new: true } // 'new' is optional here unless you need the updated user doc back
        ),
        // Add project ID to consultant's list
        User.findByIdAndUpdate(
            doc.consultant,
            { $addToSet: { associatedProjects: doc._id } }
        )
    ]);

    console.log(`[Project Post-Save Hook] Successfully updated users for project ${doc._id}`);
    next();
  } catch (error) {
    console.error(`[Project Post-Save Hook] Error updating users for project ${doc._id}:`, error);
    next(error); // Pass error to the next middleware
  }
});




// ==============================================
// Indexes for Performance
// ==============================================
projectSchema.index({ projectName: 1, status: 1 });
projectSchema.index({ contractor: 1 });
projectSchema.index({ consultant: 1 }); // Added index for consultant

module.exports = mongoose.model('Project', projectSchema);