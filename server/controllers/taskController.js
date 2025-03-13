const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Public (Admin/Contractor/Consultant/Committee)
const getTasksForProject = asyncHandler(async (req, res) => {
  console.log('Fetching tasks for project');
  const { projectId } = req.params;

  console.log(projectId);
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const tasks = await Task.find({ project: projectId })
    .populate('assignedTo', 'firstName lastName role')
    .populate('project', 'projectName')
    .sort('-createdAt');

  res.status(200).json(tasks);
});

// @desc    Create a new task
// @route   POST /api/projects/:projectId/tasks
// @access  Private (Admin/Contractor/Consultant)
const createTask = asyncHandler(async (req, res) => {
  console.log('Creating task');
  const { projectId } = req.params;
  const { taskName, taskDescription, startDate, endDate, assignedTo } = req.body;


  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const user = await User.findById(assignedTo);
  if (!user) {
    return res.status(404).json({ message: 'Assigned user not found' });
  }

  if (!taskName || !startDate || !endDate) {
    return res.status(400).json({ message: 'Required fields: taskName, startDate, endDate' });
  }

  try {
    const task = await Task.create({
      taskName,
      taskDescription,
      startDate,
      endDate,
      assignedTo,
      project: projectId,
      status: 'not_started',
      priority: 'medium'
    });

    // Add task to project's tasks array
    await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { tasks: task._id } },
      { new: true }
    );

    console.log('Task created:', task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update a task
// @route   PATCH /api/tasks/:id
// @access  Private (Admin/Assigned User)
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Check authorization
  if (req.user.role !== 'admin' && !task.assignedTo.equals(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to update this task' });
  }

  // Prevent updating protected fields for non-admins
  if (req.user.role !== 'admin') {
    delete updates.assignedTo;
    delete updates.project;
  }

  const updatedTask = await Task.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json(updatedTask);
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('Deleting task:', id);

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Remove task from project's tasks array
  await Project.findByIdAndUpdate(
    task.project,
    { $pull: { tasks: task._id } },
    { new: true }
  );

  await task.remove();

  res.status(200).json({ 
    message: 'Task deleted successfully',
    deletedId: task._id
  });
});

module.exports = {
  getTasksForProject,
  createTask,
  updateTask,
  deleteTask
};