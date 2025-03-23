const Project = require('../models/Project');
const catchAsync = require('../utils/CatchAsync');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to check if user is admin
const isAdmin = (req) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.role === 'admin';
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin only)
exports.createProject = catchAsync(async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  console.log("1");


  // Verify the JWT token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("2");

  // Get the user and role from the decoded token
  const user = await User.findById(decoded.id);
  console.log("3");
  // Only an admin can create new user accounts
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to create a new user account.'
    });
  }
 console.log("4")
  
    const {
      projectName,
      projectDescription,
      startDate,
      endDate,
      projectLocation,
      projectBudget,
      contractor,
      consultant,
      materials,
      schedules,
      comments,
      status
    } = req.body;
    try {
        const project = await Project.create({
          projectName,
          projectDescription,
          startDate,
          endDate,
          projectLocation,
          projectBudget,
          contractor,
          consultant,
          materials,
          schedules,
          comments,
          status
        });
        console.log("Project created successfully");
        res.status(201).json({
          success: true,
          data: project
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          success: false,
          message: 'Error creating project'
        });
      }
  });

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
exports.getProjects = catchAsync(async (req, res, next) => {
    console.log("1");
    try {
      const projects = await Project.find();
      console.log(projects)
      res.status(201).json({
        success: true,
        data: projects
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Error fetching projects'
      });
    }
  });

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found.'
    });
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
exports.deleteProject = catchAsync(async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    console.log("1");
  
  
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("2");
  
    // Get the user and role from the decoded token
    const user = await User.findById(decoded.id);
    console.log("3");
    // Only an admin can create new user accounts
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create a new user account.'
      });
    }

  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully.'
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
exports.updateProject = catchAsync(async (req, res, next) => {

  console.log("1");
  const token = req.header('Authorization').replace('Bearer ', '');
    console.log("1");
  
  
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("2");
  
    // Get the user and role from the decoded token
    const user = await User.findById(decoded.id);
    console.log("3");
    // Only an admin can create new user accounts
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create a new user account.'
      });
    }
  // Attempt to update the project with validation
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  console.log(project);
  // If no project found, send a 404 response
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found.'
    });
  }

  // Respond with the updated project data
  res.status(200).json({
    success: true,
    data: project
  });
});
