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

module.exports = mongoose.model('Comment', commentSchema);