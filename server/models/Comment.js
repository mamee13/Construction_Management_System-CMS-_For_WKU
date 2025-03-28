const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide comment content'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must belong to a user']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Comment must be associated with a project']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true, // Adds `createdAt` and `updatedAt` fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster querying
commentSchema.index({ user: 1 });
commentSchema.index({ project: 1 });

// Pre-save middleware to update `updatedAt`
commentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware to cascade delete comments if a project/user is deleted (optional)
commentSchema.pre('remove', async function(next) {
  // Optional: Add logic here if comments need to be deleted when a project/user is removed
  next();
});

// Add this post-save hook to commentSchema

commentSchema.post('save', async function(doc, next) {
  // Note: Your existing pre-save hook updates 'updatedAt'. Keep that!
  console.log(`[Comment Post-Save Hook] Adding comment ${doc._id} to project ${doc.project}`);
  try {
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(
      doc.project,
      { $addToSet: { comments: doc._id } }
    );
    console.log(`[Comment Post-Save Hook] Successfully added comment ${doc._id} to project ${doc.project}`);
    next();
  } catch (error) {
    console.error(`[Comment Post-Save Hook] Error adding comment ${doc._id} to project ${doc.project}:`, error);
    next(error);
  }
});

// Add a pre-remove hook to clean up the project array if a comment is deleted directly
// Note: Your existing pre-remove hook is empty, which is fine. Add this logic.
commentSchema.pre('remove', async function(next) {
    console.log(`[Comment Pre-Remove Hook] Removing comment ${this._id} from project ${this.project}`);
    try {
        const Project = mongoose.model('Project');
        await Project.findByIdAndUpdate(
            this.project,
            { $pull: { comments: this._id } } // Remove the comment's ID
        );
        console.log(`[Comment Pre-Remove Hook] Successfully removed comment ${this._id} from project ${this.project}`);
        next();
    } catch (error) {
        console.error(`[Comment Pre-Remove Hook] Error removing comment ${this._id} from project ${this.project}:`, error);
        next(error);
    }
});


module.exports = mongoose.model('Comment', commentSchema);