
const Schedule = require('../models/Schedule');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

// @desc    Get all schedules for a project
// @route   GET /api/projects/:projectId/schedules
// @access  Public (Admin/Contractor/Consultant/Committee) - Note: Access control not implemented in function
const getSchedulesForProject = asyncHandler(async (req, res) => {
  console.log('Fetching schedules for project');
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const schedules = await Schedule.find({ project: projectId })
    .populate('assignedTo', 'firstName lastName role')
    .populate('task', 'taskName')
    .sort('-createdAt');

  res.status(200).json(schedules);
});



// // @desc    Create a new schedule
// // @route   POST /api/schedules
// // @access  Private (Admin/Contractor/Consultant/Committee) - Note: Access control not implemented in function
// const createSchedule = asyncHandler(async (req, res) => {
//   console.log('Creating schedule');

//   // Expect project id to come from the request body now
//   const {
//     scheduleName,
//     scheduleDescription,
//     startDate,
//     endDate,
//     task,
//     assignedTo,
//     project,  // <-- project id now comes from body instead of req.params
//     status,
//     priority
//   } = req.body;
//  console.log('Received request to create schedule:',req.body);
//   // Validate required fields
//   if (!scheduleName || !scheduleDescription || !startDate || !endDate || !task || !assignedTo || !project) {
//     return res.status(400).json({
//       message:
//         'Required fields: scheduleName, scheduleDescription, startDate, endDate, task, assignedTo, project'
//     });
//   }
// console.log("reciving")
//   // Validate existence of project
//   const projectDoc = await Project.findById(project);
//   if (!projectDoc) {
//     return res.status(404).json({ message: 'Project not found' });
//   }
//  console.log("project is valid")
//   // Validate existence of task
//   const taskDoc = await Task.findById(task);
//   if (!taskDoc) {
//     return res.status(404).json({ message: 'Task not found' });
//   }
//   console.log("task is valid")
//   // Validate assigned user
//   const user = await User.findById(assignedTo);
//   if (!user) {
//     return res.status(404).json({ message: 'Assigned user not found' });
//   }
// console.log("user is valid")
//   try {
//     const schedule = await Schedule.create({
//       scheduleName,
//       scheduleDescription,
//       startDate,
//       endDate,
//       task,
//       assignedTo,
//       project, // assign project id from body
//       status: status || 'planned',
//       priority: priority || 'medium'
//     });

//     console.log('Schedule created:', schedule);
//     res.status(201).json(schedule);
//   } catch (error) {
//     console.error('Error creating schedule:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });
// @desc    Create a new schedule
// @route   POST /api/schedules
// @access  Private (Admin/Consultant)
const createSchedule = asyncHandler(async (req, res) => {
  console.log('Attempting to create schedule by user:', req.user.id); // User ID from authMiddleware

  const {
    scheduleName,
    scheduleDescription,
    startDate,
    endDate,
    task,
    assignedTo,
    project,
    status,
    priority
  } = req.body;

  // Basic validation (Mongoose validation is primary)
  if (!scheduleName || !scheduleDescription || !startDate || !endDate || !task || !assignedTo || !project) {
    return res.status(400).json({
      message: 'Required fields: scheduleName, scheduleDescription, startDate, endDate, task, assignedTo, project'
    });
  }

  // Validate existence of referenced documents
  const [projectDoc, taskDoc, assignedUserDoc] = await Promise.all([
      Project.findById(project).lean(), // Use lean for read-only checks
      Task.findById(task).lean(),
      User.findById(assignedTo).lean()
  ]);

  if (!projectDoc) return res.status(404).json({ message: 'Project not found' });
  if (!taskDoc) return res.status(404).json({ message: 'Task not found' });
  if (!assignedUserDoc) return res.status(404).json({ message: 'Assigned user not found' });

  try {
    const schedule = await Schedule.create({
      scheduleName,
      scheduleDescription,
      startDate,
      endDate,
      task,
      assignedTo,
      project,
      status: status || 'planned',
      priority: priority || 'medium',
      createdBy: req.user.id // <-- SET THE CREATOR HERE
    });

    console.log('Schedule created:', schedule._id);
    // Populate necessary fields for the response
    const populatedSchedule = await Schedule.findById(schedule._id)
        .populate('assignedTo', 'firstName lastName role')
        .populate('task', 'taskName')
        .populate('project', 'projectName')
        .populate('createdBy', 'firstName lastName'); // Populate creator info

    res.status(201).json(populatedSchedule); // Send back populated schedule
  } catch (error) {
     console.error('Error creating schedule:', error);
     if (error.name === 'ValidationError') {
         const messages = Object.values(error.errors).map(val => val.message);
         return res.status(400).json({ message: "Validation Failed", errors: messages });
     }
     // Check for specific errors from pre-save hooks
     if (error.message.includes('Task or project not found') ||
         error.message.includes('Schedule dates must be within') ||
         error.message.includes('End date must be on or after')) {
          return res.status(400).json({ message: error.message });
     }
     res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// // @desc    Update a schedule
// // @route   PATCH /api/schedules/:scheduleId
// // @access  Private (Admin or Consultant) // <-- UPDATED ACCESS COMMENT
// const updateSchedule = asyncHandler(async (req, res) => {
//   console.log("0");
//   const authHeader = req.header('Authorization'); // Get header
//   if (!authHeader || !authHeader.startsWith('Bearer ')) { // Basic check for header
//       return res.status(401).json({ success: false, message: 'Authorization token is required' });
//   }
//   const token = authHeader.replace('Bearer ', '');
//   console.log("1");

//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//   } catch (error) {
//     console.error("JWT Verification Error:", error.message);
//     return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
//   }
//   console.log("2");

//   const user = await User.findById(decoded.id);
//   console.log("3");

//   if (!user) {
//       return res.status(401).json({ success: false, message: 'User not found for this token' });
//   }

//   // *** MODIFIED PERMISSION CHECK ***
//   // Only an admin or consultant can update schedule
//   if (!['admin', 'consultant'].includes(user.role)) {
//     return res.status(403).json({
//       success: false,
//       message: 'You do not have permission to update this schedule. Requires Admin or Consultant role.' // Updated message
//     });
//   }
//   // *** END MODIFIED PERMISSION CHECK ***

//   console.log('Updating schedule');
//   const { scheduleId } = req.params; // Using scheduleId as per route
//   const updates = req.body;
//   console.log("schedule id is", scheduleId);

//   // Retrieve the document
//   const schedule = await Schedule.findById(scheduleId); // Using scheduleId
//   if (!schedule) {
//     return res.status(404).json({ message: 'Schedule not found' });
//   }

//   // Update the schedule document fields
//   Object.keys(updates).forEach((key) => {
//     schedule[key] = updates[key];
//   });

//   try {
//     // Save the document to trigger validation with proper document context
//     const updatedSchedule = await schedule.save();
//     res.status(200).json(updatedSchedule);
//   } catch (error) {
//     console.error('Error updating schedule:', error);
//     // Add basic validation error check
//     if (error.name === 'ValidationError') {
//         return res.status(400).json({ message: error.message });
//     }
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });


// // @desc    Delete a schedule
// // @route   DELETE /api/schedules/:id
// // @access  Private (Admin or Consultant) // <-- UPDATED ACCESS COMMENT
// const deleteSchedule = asyncHandler(async (req, res) => {
//   const { id } = req.params; // Using id as per route definition
//   console.log('Attempting to delete schedule:', id);

//   // *** ADDED PERMISSION CHECK ***
//   const authHeader = req.header('Authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ success: false, message: 'Authorization token is required' });
//   }
//   const token = authHeader.replace('Bearer ', '');

//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//   } catch (error) {
//     console.error("JWT Verification Error:", error.message);
//     return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
//   }

//   const user = await User.findById(decoded.id);

//   if (!user) {
//       return res.status(401).json({ success: false, message: 'User not found for this token' });
//   }

//   // Only an admin or consultant can delete a schedule
//   if (!['admin', 'consultant'].includes(user.role)) {
//     return res.status(403).json({
//       success: false,
//       message: 'You do not have permission to delete this schedule. Requires Admin or Consultant role.'
//     });
//   }
//   // *** END ADDED PERMISSION CHECK ***

//   const schedule = await Schedule.findById(id); // Using id
//   if (!schedule) {
//     return res.status(404).json({ message: 'Schedule not found' });
//   }

//   console.log('Schedule found, proceeding with deletion');
//   try {
//     // Optionally remove schedule from project's schedules array if supported
//     if (schedule.project) {
//         await Project.findByIdAndUpdate(
//           schedule.project,
//           { $pull: { schedules: schedule._id } },
//           { new: true }
//         ).catch(err => {
//             console.error('Error updating project reference during schedule deletion:', err);
//         });
//     }

//     await schedule.deleteOne();
//     res.status(200).json({
//       message: 'Schedule deleted successfully',
//       deletedId: schedule._id
//     });
//   } catch (error) {
//     console.error('Error deleting schedule:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// @desc    Update a schedule
// @route   PATCH /api/schedules/:scheduleId
// @access  Private (Admin: Any, Consultant: Own)
const updateSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const updates = req.body;
  const userId = req.user.id; // User ID from authMiddleware
  const userRole = req.user.role; // User role from authMiddleware

  console.log(`Attempting to update schedule ${scheduleId} by user: ${userId} (Role: ${userRole})`);

  // Retrieve the schedule *including* the createdBy field
  const schedule = await Schedule.findById(scheduleId);

  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }

  // --- AUTHORIZATION CHECK ---
  // Admins can update any schedule.
  // Consultants can only update schedules they created.
  if (userRole !== 'admin' && schedule.createdBy.toString() !== userId.toString()) {
    console.warn(`Authorization Failed: User ${userId} (Consultant) attempted to update schedule ${scheduleId} created by ${schedule.createdBy}`);
    return res.status(403).json({ // 403 Forbidden
      success: false,
      message: 'Forbidden: You do not have permission to update this schedule. Consultants can only update schedules they created.'
    });
  }
  // --- END AUTHORIZATION CHECK ---

  // Prevent updating immutable fields like createdBy or critical relations if needed
  delete updates.createdBy; // Ensure createdBy cannot be changed
  delete updates.project;   // Prevent changing project relation via update
  delete updates.task;      // Prevent changing task relation via update

  // Apply updates
  Object.keys(updates).forEach((key) => {
    // Check if the key is a valid path in the schema before assigning
    if (Schedule.schema.path(key)) {
        schedule[key] = updates[key];
    } else {
         console.warn(`Update ignored for non-schema path: ${key}`);
    }
  });


  try {
    const updatedSchedule = await schedule.save(); // Triggers validation & hooks
    console.log('Schedule updated successfully:', updatedSchedule._id);

     // Populate necessary fields for the response
    const populatedSchedule = await Schedule.findById(updatedSchedule._id)
        .populate('assignedTo', 'firstName lastName role')
        .populate('task', 'taskName')
        .populate('project', 'projectName')
        .populate('createdBy', 'firstName lastName');

    res.status(200).json(populatedSchedule);
  } catch (error) {
    console.error(`Error updating schedule ${scheduleId}:`, error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: "Validation Failed", errors: messages });
    }
     // Check for specific errors from pre-save hooks
     if (error.message.includes('Task or project not found') ||
         error.message.includes('Schedule dates must be within') ||
         error.message.includes('End date must be on or after')) {
          return res.status(400).json({ message: error.message });
     }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// @desc    Delete a schedule
// @route   DELETE /api/schedules/:scheduleId
// @access  Private (Admin: Any, Consultant: Own)
const deleteSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // User ID from authMiddleware
  const userRole = req.user.role; // User role from authMiddleware
  console.log(`Attempting to delete schedule: ${id} by user: ${userId} (Role: ${userRole})`);
   
  const schedule = await Schedule.findById(id);
  console.log(`Found schedule: ${schedule}`);
  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }

  // --- AUTHORIZATION CHECK ---
  // Admins can delete any schedule.
  // Consultants can only delete schedules they created.
  if (userRole !== 'admin' && schedule.createdBy.toString() !== userId.toString()) {
     console.warn(`Authorization Failed: User ${userId} (Consultant) attempted to delete schedule ${scheduleId} created by ${schedule.createdBy}`);
    return res.status(403).json({ // 403 Forbidden
      success: false,
      message: 'Forbidden: You do not have permission to delete this schedule. Consultants can only delete schedules they created.'
    });
  }
  // --- END AUTHORIZATION CHECK ---

  console.log('Authorization passed, proceeding with deletion for schedule:', id);
  try {
    // Use .remove() to trigger Mongoose 'pre' and 'post' remove middleware
    //await schedule.remove();
    await schedule.deleteOne();
    console.log('Schedule deleted successfully:', id);
    res.status(200).json({
      success: true, // Add success flag
      message: 'Schedule deleted successfully',
      deletedId: id // Use the ID passed in params
    });
  } catch (error) {
    console.error(`Error deleting schedule ${id}:`, error);
    // Check for errors from pre-remove hooks
    if (error.message.includes('Error processing pre-remove')) {
         return res.status(500).json({ message: 'Server error during cleanup', error: error.message });
    }
    res.status(500).json({ message: 'Server error during deletion', error: error.message });
  }
});


// @desc    Get all schedules (across projects)
// @route   GET /api/schedules
// @access  Public (Admin/Contractor/Consultant/Committee) - Note: Access control not implemented in function
// const getAllSchedules = asyncHandler(async (req, res) => {
//   const schedules = await Schedule.find()
//     .populate('project', 'projectName')
//     .populate('assignedTo', 'firstName lastName role')
//     .populate('task', 'taskName')
//     .sort('-createdAt');
//   res.status(200).json({ schedules }); // Original response format kept
// });
const getAllSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find()
    .populate('project', 'projectName')
    .populate('assignedTo', 'firstName lastName role')
    .populate('task', 'taskName')
    .populate('createdBy', 'firstName lastName _id') // *** ADD THIS LINE *** (include _id)
    .sort('-createdAt');
  res.status(200).json({ schedules }); // Response structure is { schedules: [...] }
});


// @desc    Get a schedule by ID
// @route   GET /api/schedules/:scheduleId  <-- REVERTED route comment
// @access  Public (or appropriate role) - Note: Access control not implemented in function
const getScheduleById = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params; // <-- REVERTED to scheduleId
  console.log('Fetching schedule by ID:', scheduleId); // <-- REVERTED to scheduleId
  const schedule = await Schedule.findById(scheduleId) // <-- REVERTED to scheduleId
    .populate('project', 'projectName')
    .populate('assignedTo', 'firstName lastName role')
    .populate('task', 'taskName')
    .populate('createdBy', 'firstName lastName _id'); 

  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }
  console.log('Schedule found:', schedule);

  res.status(200).json(schedule); // Original response format kept
});

module.exports = {
  getSchedulesForProject,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAllSchedules,
  getScheduleById
};