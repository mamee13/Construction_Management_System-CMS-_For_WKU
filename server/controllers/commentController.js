const Comment = require('../models/Comment');
const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { isValidObjectId } = require('mongoose');

// @desc    Get all comments for a project
// @route   GET /api/projects/:projectId/comments
// @access  Public (Admin/Contractor/Consultant/Committee)
const getCommentsForProject = asyncHandler(async (req, res) => {
  console.log('1')
  const { projectId } = req.params;

  if (!isValidObjectId(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const comments = await Comment.find({ project: projectId })
    .populate('user', 'firstName lastName role')
    .sort('-createdAt');

  res.status(200).json(comments);
});

// @desc    Create a new comment
// @route   POST /api/projects/:projectId/comments
// @access  Private (Admin/Contractor/Consultant/Committee)
const createComment = asyncHandler(async (req, res) => {
  console.log('0');

  const { projectId } = req.params;
  const { content, user: userId } = req.body; // renamed for clarity
  
  const project = await Project.findById(projectId);
  const findUser = await User.findById(userId);
  // const ll = await User.findById(userId);
  // console.log(ll);

  console.log('Received request to create comment:');

  // Validate project ID
  if(!project) {
    return res.status(404).json(
      {
        message: "a comment must need a project"
      }
    )
  }
  // Validate user ID
  if(!findUser) {
    return res.status(404).json(
      {
        message: "a comment must need a user"
      }
    )
  }
  // Validate content
  if (!content) {
    console.log('3')

    console.error('Comment content is required');
    return res.status(400).json({ message: 'Comment content is required' });
  }

  // Check if the user exists


  try {
    // Check if the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('Project found:');

    // Create the comment
    const comment = await Comment.create({
      content,
      user: findUser._id,
      project: projectId
    });

    console.log('Comment created:', comment);

    // Add the comment to the project's comments array (if your Project model supports this)
    await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { comments: comment._id } },
      { new: true }
    );

    console.log('Comment added to project:', projectId);

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// @desc    Update a comment
// @route   PATCH /api/comments/:id
// @access  Private (Comment owner only)
const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  const comment = await Comment.findById(id);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  // Check if the user is the comment owner
  if (!comment.user.equals(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to update this comment' });
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    id,
    { content, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedComment);
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (Comment owner or Admin)
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  const comment = await Comment.findById(id);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  // Check if the user is the comment owner or an admin
  if (!comment.user.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this comment' });
  }

  // Remove comment from the project's comments array
  await Project.findByIdAndUpdate(
    comment.project,
    { $pull: { comments: comment._id } },
    { new: true }
  );

  await comment.remove();

  res.status(200).json({ 
    message: 'Comment deleted successfully',
    deletedId: comment._id
  });
});

module.exports = {
  getCommentsForProject,
  createComment,
  updateComment,
  deleteComment
};