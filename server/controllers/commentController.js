const Comment = require('../models/Comment');
const Project = require('../models/Project');

exports.createComment = async (req, res) => {
  try {
    const { projectId, content } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const comment = await Comment.create({
      projectId,
      userId,
      content
    });

    await comment.populate('userId', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProjectComments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const comments = await Comment.find({ projectId })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};