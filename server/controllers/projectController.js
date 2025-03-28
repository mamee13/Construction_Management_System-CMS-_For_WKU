// const Project = require('../models/Project');
// const catchAsync = require('../utils/CatchAsync');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// // Helper function to check if user is admin
// const isAdmin = (req) => {
//   const token = req.header('Authorization').replace('Bearer ', '');
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   return decoded.role === 'admin';
// };

// // @desc    Create new project
// // @route   POST /api/projects
// // @access  Private (Admin only)
// exports.createProject = catchAsync(async (req, res, next) => {
//   const token = req.header('Authorization').replace('Bearer ', '');
//   console.log("1");


//   // Verify the JWT token
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   console.log("2");

//   // Get the user and role from the decoded token
//   const user = await User.findById(decoded.id);
//   console.log("3");
//   // Only an admin can create new user accounts
//   if (user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       message: 'You do not have permission to create a new user account.'
//     });
//   }
//  console.log("4")
  
//     const {
//       projectName,
//       projectDescription,
//       startDate,
//       endDate,
//       projectLocation,
//       projectBudget,
//       contractor,
//       consultant,
//       materials,
//       schedules,
//       comments,
//       status
//     } = req.body;
//     try {
//         const project = await Project.create({
//           projectName,
//           projectDescription,
//           startDate,
//           endDate,
//           projectLocation,
//           projectBudget,
//           contractor,
//           consultant,
//           materials,
//           schedules,
//           comments,
//           status
//         });
//         console.log("Project created successfully");
//         res.status(201).json({
//           success: true,
//           data: project
//         });
//       } catch (err) {
//         console.error(err);
//         res.status(500).json({
//           success: false,
//           message: 'Error creating project'
//         });
//       }
//   });

// // @desc    Get all projects
// // @route   GET /api/projects
// // @access  Public
// exports.getProjects = catchAsync(async (req, res, next) => {
//     console.log("1");
//     try {
//       const projects = await Project.find();
//       //console.log(projects)
//       res.status(201).json({
//         success: true,
//         data: projects
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching projects'
//       });
//     }
//   });

// // @desc    Get project by ID
// // @route   GET /api/projects/:id
// // @access  Public
// exports.getProject = catchAsync(async (req, res, next) => {
//   const project = await Project.findById(req.params.id);

//   if (!project) {
//     return res.status(404).json({
//       success: false,
//       message: 'Project not found.'
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: project
//   });
// });

// // @desc    Delete project
// // @route   DELETE /api/projects/:id
// // @access  Private (Admin only)
// exports.deleteProject = catchAsync(async (req, res, next) => {
//     const token = req.header('Authorization').replace('Bearer ', '');
//     console.log("1");
  
  
//     // Verify the JWT token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("2");
  
//     // Get the user and role from the decoded token
//     const user = await User.findById(decoded.id);
//     console.log("3");
//     // Only an admin can create new user accounts
//     if (user.role !== 'admin') {
//       return res.status(403).json({
//         success: false,
//         message: 'You do not have permission to create a new user account.'
//       });
//     }

//   const project = await Project.findByIdAndDelete(req.params.id);

//   if (!project) {
//     return res.status(404).json({
//       success: false,
//       message: 'Project not found.'
//     });
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Project deleted successfully.'
//   });
// });

// // @desc    Update project
// // @route   PUT /api/projects/:id
// // @access  Private (Admin only)
// exports.updateProject = catchAsync(async (req, res, next) => {

//   console.log("1");
//   const token = req.header('Authorization').replace('Bearer ', '');
//     console.log("1");
  
  
//     // Verify the JWT token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("2");
  
//     // Get the user and role from the decoded token
//     const user = await User.findById(decoded.id);
//     console.log("3");
//     // Only an admin can create new user accounts
//     if (user.role !== 'admin') {
//       return res.status(403).json({
//         success: false,
//         message: 'You do not have permission to create a new user account.'
//       });
//     }
//   // Attempt to update the project with validation
//   const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   console.log(project);
//   // If no project found, send a 404 response
//   if (!project) {
//     return res.status(404).json({
//       success: false,
//       message: 'Project not found.'
//     });
//   }

//   // Respond with the updated project data
//   res.status(200).json({
//     success: true,
//     data: project
//   });
// });

const Project = require('../models/Project');
const User = require('../models/User'); // Assuming User model is in ../models/User
const catchAsync = require('../utils/CatchAsync'); // Assuming you have this utility
const jwt = require('jsonwebtoken');
// const ErrorResponse = require('../utils/ErrorResponse'); // Optional: For consistent error handling

// --- Authorization Middleware ---
// Place this before your route handlers or apply it in your router setup
exports.isAdminMiddleware = catchAsync(async (req, res, next) => {
    let token;

    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // else if (req.cookies.token) { // Alternative: Check for token in cookies
    //   token = req.cookies.token;
    // }

    if (!token) {
        // Using 401 for unauthorized access
        return res.status(401).json({ success: false, message: 'Not authorized to access this route (no token)' });
        // Or use ErrorResponse: return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user and check role
        const user = await User.findById(decoded.id);

        if (!user) {
             return res.status(401).json({ success: false, message: 'Not authorized (user not found)' });
            // return next(new ErrorResponse('User not found', 401));
        }

        if (user.role !== 'admin') {
            // Using 403 for forbidden access (valid user, insufficient permissions)
            return res.status(403).json({ success: false, message: 'User role does not have permission for this action' });
           // return next(new ErrorResponse('User role does not have permission for this action', 403));
        }

        // Grant access, optionally attach user to request
        req.user = user;
        next();

    } catch (err) {
         console.error("Auth Error:", err);
         return res.status(401).json({ success: false, message: 'Not authorized (token failed)' });
        // return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});


// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin only - Use isAdminMiddleware in router)
exports.createProject = catchAsync(async (req, res, next) => {
    // req.body should NOT contain materials, schedules, comments arrays initially.
    // These are managed via middleware on those models.
    const {
        projectName,
        projectDescription,
        startDate,
        endDate,
        projectLocation,
        projectBudget,
        contractor, // Expect ObjectId
        consultant, // Expect ObjectId
        status      // Optional, defaults to 'planned' in schema
    } = req.body;

    // Basic validation (can add more robust validation library like Joi)
    if (!projectName || !projectDescription || !startDate || !endDate || !projectLocation || projectBudget === undefined || !contractor || !consultant) {
         return res.status(400).json({ success: false, message: 'Missing required project fields' });
        // return next(new ErrorResponse('Please provide all required project fields', 400));
    }

    const project = await Project.create({
        projectName,
        projectDescription,
        startDate,
        endDate,
        projectLocation,
        projectBudget,
        contractor,
        consultant,
        status // Will use default if not provided
    });

    console.log("Project created successfully:", project._id);
    res.status(201).json({
        success: true,
        data: project // Return the newly created project
    });
});

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public (or Private based on your needs)
exports.getProjects = catchAsync(async (req, res, next) => {
    // Consider adding filtering, sorting, pagination here later
    const projects = await Project.find()
        .populate('contractor', 'firstName lastName') // Populate basic info for list view
        .populate('consultant', 'firstName lastName')
        .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({ // Use 200 OK for successful GET
        success: true,
        count: projects.length, // Good practice to include count
        data: projects
    });
});

// @desc    Get single project by ID (POPULATED)
// @route   GET /api/projects/:id
// @access  Public (or Private)
exports.getProject = catchAsync(async (req, res, next) => {
    const project = await Project.findById(req.params.id)
        .populate('materials') // Populate the materials array fully
        .populate('schedules') // Populate the schedules array fully
        .populate('tasks')     // Populate the tasks array fully
        .populate({
            path: 'comments',  // Populate comments array
            populate: {        // Nested populate for the user within each comment
                path: 'user',
                select: 'firstName lastName email _id' // Select specific user fields
            },
             options: { sort: { createdAt: -1 } } // Sort comments newest first
        })
        .populate('contractor', 'firstName lastName email phone role _id') // Populate contractor details
        .populate('consultant', 'firstName lastName email phone role _id'); // Populate consultant details

    if (!project) {
        return res.status(404).json({ success: false, message: `Project not found with id ${req.params.id}` });
       // return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: project // Send the fully populated project
    });
});

// @desc    Update project
// @route   PATCH /api/projects/:id (Using PATCH is often better for partial updates)
// @access  Private (Admin only - Use isAdminMiddleware in router)
exports.updateProject = catchAsync(async (req, res, next) => {
    // Ensure arrays are not accidentally overwritten if sent in body
    // It's safer to manage array contents (add/remove materials etc.) via dedicated routes
    console.log("1");
    const updateData = { ...req.body };
    delete updateData.materials;
    delete updateData.schedules;
    delete updateData.tasks;
    delete updateData.comments;
    // Also potentially delete fields managed by middleware like totalCost if applicable

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
        new: true,           // Return the updated document
        runValidators: true  // Ensure schema validations run on update
    });

    if (!project) {
         return res.status(404).json({ success: false, message: `Project not found with id ${req.params.id}` });
        // return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
    }

    console.log("Project updated successfully:", project._id);
    res.status(200).json({
        success: true,
        data: project
    });
});


// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only - Use isAdminMiddleware in router)
exports.deleteProject = catchAsync(async (req, res, next) => {
    const project = await Project.findById(req.params.id);
    console.log("2");
    if (!project) {
         return res.status(404).json({ success: false, message: `Project not found with id ${req.params.id}` });
        // return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
    }
 console.log("3");
    // Use document.remove() to trigger 'pre('remove')' middleware for cascade delete
    await project.remove();
console.log("4");
    console.log("Project deleted successfully:", req.params.id);
    res.status(200).json({
        success: true,
        message: 'Project and related data deleted successfully.'
        // Sending deleted ID can be useful for frontend state update
        // data: { deletedId: req.params.id }
    });
});