const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const catchAsync = require('../utils/CatchAsync');
const jwt = require('jsonwebtoken');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin only)
exports.createTask = catchAsync(async (req, res, next) => {
  console.log("1");
  
  // Check for Authorization header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.error("Authorization header missing");
    return res.status(401).json({
      success: false,
      message: 'Authorization header missing'
    });
  }
  
  // Extract and verify JWT token
  const token = authHeader.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("2");
  
  const user = await User.findById(decoded.id);
  console.log("3");
  
  // Only an admin can create a new task
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized access'
    });
  }
  console.log("4");

  const {
    taskName,
    taskDescription,
    startDate,
    endDate,
    assignedTo,
    project,
    status,
    priority
  } = req.body;
  console.log("5");

  // Validate required fields
  if (!taskName || !startDate || !endDate || !assignedTo || !project) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: taskName, startDate, endDate, assignedTo, project'
    });
  }

  // Validate project exists
  const existingProject = await Project.findById(project);
  if (!existingProject) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Validate assigned user exists
  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) {
    return res.status(404).json({
      success: false,
      message: 'Assigned user not found'
    });
  }

  try {
    const task = await Task.create({
      taskName,
      taskDescription,
      startDate,
      endDate,
      assignedTo,
      project,
      status: status || 'not_started',
      priority: priority || 'medium'
    });
    console.log("Task created successfully");

    // Add the task to the project's tasks array
    existingProject.tasks.addToSet(task._id);
    await existingProject.save();

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating task'
    });
  }
});

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public
// exports.getTasks = catchAsync(async (req, res, next) => {
//   console.log("Getting tasks");
//   try {
//     const tasks = await Task.find()
//       .populate('assignedTo', 'firstName lastName role')
//       .populate('project', 'projectName');
//     console.log("Tasks retrieved successfully");
//     res.status(200).json({
//       success: true,
//       data: tasks
//     });
//   } catch (error) {
//     console.error('Error fetching tasks:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching tasks'
//     });
//   }
// });

// @desc    Get tasks (optionally filtered by project)
// @route   GET /api/tasks
// @access  Public
exports.getTasks = catchAsync(async (req, res, next) => {
  console.log("Getting tasks");

  // Build filter object based on query parameters
  const filter = {};
  if (req.query.project) {
    filter.project = req.query.project;
  }

  try {
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'firstName lastName role')
      .populate('project', 'projectName');

    console.log("Tasks retrieved successfully");
    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
});


// NEW: Get a single task by ID
// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Public (or adjust as needed)
exports.getTaskById = catchAsync(async (req, res, next) => {
  console.log("Getting task by ID:", req.params.id);
  
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'firstName lastName role')
    .populate('project', 'projectName');
  
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  console.log("Task found:", task.taskName);
  res.status(200).json({
    success: true,
    data: task
  });
});


// @desc    Update task
// @route   PATCH /api/tasks/:id
// @access  Private (Admin only)
// exports.updateTask = catchAsync(async (req, res, next) => {
//   // Extract and verify JWT token
//   const token = req.header('Authorization').replace('Bearer ', '');
//   console.log("1");

//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   console.log("2");

//   const user = await User.findById(decoded.id);
//   console.log("3");

//   // Only an admin can update a task
//   if (user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       message: 'Unauthorized access'
//     });
//   }
//   console.log("4");

//   try {
//     const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true
//     });
//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: 'Task not found'
//       });
//     }
//     console.log("Task updated successfully");
//     res.status(200).json({
//       success: true,
//       data: task
//     });
//   } catch (error) {
//     console.error('Error updating task:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Error updating task'
//     });
//   }
// });
exports.updateTask = catchAsync(async (req, res, next) => {
  console.log("Updating task...");

  // Extract and verify JWT token
  const token = req.header('Authorization').replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized access'
    });
  }

  try {
    // Ensure `runValidators: true` and use `context: query`
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    console.log("Task updated successfully:", task);
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating task'
    });
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
exports.deleteTask = catchAsync(async (req, res, next) => {
  // Extract and verify JWT token
  const token = req.header('Authorization').replace('Bearer ', '');
  console.log("1");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("2");

  const user = await User.findById(decoded.id);
  console.log("3");

  // Only an admin can delete a task
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized access'
    });
  }
  console.log("4");

  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    console.log("Task deleted successfully");
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
});
