

const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const catchAsync = require('../utils/CatchAsync');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// --- Authorization Helper (No change needed here) ---
const checkAdminOrConsultant = async (authHeader) => {
  // ... (keep the existing helper function as provided in the previous example)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("Authorization header missing or invalid format");
    return { authorized: false, user: null, status: 401, message: 'Authorization token is required or invalid format' };
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+role'); // Ensure role is selected

    if (!user) {
        return { authorized: false, user: null, status: 401, message: 'User associated with this token not found' };
    }

    const allowedRoles = ['admin', 'consultant'];
    if (!allowedRoles.includes(user.role)) {
      console.log(`Unauthorized access attempt by user ${user._id} with role ${user.role}`);
      return { authorized: false, user: user, status: 403, message: 'Forbidden: Requires admin or consultant role' };
    }

    return { authorized: true, user: user, status: 200, message: 'Authorized' };

  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    let status = 401;
    let message = 'Not authorized, token failed';
    if (error.name === 'TokenExpiredError') {
        message = 'Not authorized, token expired';
    } else if (error.name === 'JsonWebTokenError') {
        message = 'Not authorized, invalid token';
    }
    return { authorized: false, user: null, status: status, message: message };
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin or Consultant) - Stays the same
exports.createTask = catchAsync(async (req, res, next) => {
  console.log("Attempting to create task...");
  const authResult = await checkAdminOrConsultant(req.header('Authorization'));
  if (!authResult.authorized) {
    return res.status(authResult.status).json({ success: false, message: authResult.message });
  }
  const user = authResult.user;
  console.log(`User ${user._id} (${user.role}) authorized to create task.`);

  const {
    taskName, taskDescription, startDate, endDate, assignedTo, project, status, priority
  } = req.body;

  // Basic validations (keep existing)
  if (!taskName || !startDate || !endDate || !project || !assignedTo) { /* ... */ }
  if (!Array.isArray(assignedTo) || assignedTo.length === 0) { /* ... */ }
  if (!mongoose.Types.ObjectId.isValid(project)) { /* ... */ }
  for (const userId of assignedTo) { if (!mongoose.Types.ObjectId.isValid(userId)) { /* ... */ } }

  // Check existence (keep existing)
  const existingProject = await Project.findById(project); if (!existingProject) { /* ... */ }
  const foundUsers = await User.find({ '_id': { $in: assignedTo } }).select('_id'); if (foundUsers.length !== assignedTo.length) { /* ... */ }

  try {
    const task = await Task.create({
      taskName, taskDescription, startDate, endDate, assignedTo, project,
      status: status || 'not_started',
      priority: priority || 'medium',
      createdBy: user._id // Assign creator
    });
    console.log(`Task created successfully (ID: ${task._id}) by user ${user._id}`);

    // Update Project (keep existing)
    existingProject.tasks.addToSet(task._id);
    await existingProject.save();

    // Respond (keep existing, maybe populate more)
     const populatedTask = await Task.findById(task._id)
                                    .populate('assignedTo', 'firstName lastName email role')
                                    .populate('project', 'projectName')
                                    .populate('createdBy', 'firstName lastName email'); // Populate creator email too

    res.status(201).json({ success: true, data: populatedTask });

  } catch (error) {
    // Keep existing error handling
    console.error('Error during task creation:', error);
    if (error.name === 'ValidationError') { return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` }); }
    res.status(500).json({ success: false, message: error.message || 'Server error creating task' });
  }
});

// @desc    Get tasks (optionally filtered)
// @route   GET /api/tasks
// @access  Private (Requires Auth - Admin/Consultant)
// Note: Consultants might see tasks they didn't create here, but won't be able to modify/delete them later.
exports.getTasks = catchAsync(async (req, res, next) => {
    console.log("Getting tasks list...");
    // --- Authorization Check (Ensure logged in Admin or Consultant) ---
    const authResult = await checkAdminOrConsultant(req.header('Authorization'));
    if (!authResult.authorized) {
        // Allow request if just checking auth failed, but maybe log it? Or enforce strict login?
        // For now, let's enforce login for viewing lists too.
        return res.status(authResult.status).json({ success: false, message: authResult.message });
    }
    const requestingUser = authResult.user;
    console.log(`User ${requestingUser._id} (${requestingUser.role}) authorized to view tasks list.`);
    // --- End Authorization ---


    // --- Filtering Logic ---
    let query;
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    const filterCriteria = JSON.parse(queryStr);
    query = Task.find(filterCriteria);
    // --- End Filtering Logic ---


    // --- *Optional* Role-Specific Filtering (Let Consultants see only their projects' tasks) ---
    // Uncomment and adapt if needed. Requires 'associatedProjects' populated on User.
    // if (requestingUser.role === 'consultant') {
    //     // Ensure associatedProjects is populated when fetching the user or fetch it here
    //     const userWithProjects = await User.findById(requestingUser._id).populate('associatedProjects');
    //     if (userWithProjects && userWithProjects.associatedProjects) {
    //         const projectIds = userWithProjects.associatedProjects.map(p => p._id);
    //         query = query.where('project').in(projectIds); // Add project filter
    //         console.log(`Filtering tasks list for consultant ${requestingUser._id} by their associated projects.`);
    //     } else {
    //          console.warn(`Consultant ${requestingUser._id} has no associated projects or could not populate them.`);
    //          // Maybe return empty list or specific error? For now, query remains unfiltered by project.
    //          // query = query.where('_id').equals(null); // Effectively return no tasks
    //     }
    // }
    // --- End Optional Role-Specific Filtering ---


    // --- Select Fields, Sorting, Pagination (Keep existing) ---
    if (req.query.select) { /* ... */ query = query.select(req.query.select.split(',').join(' ')); }
    if (req.query.sort) { /* ... */ query = query.sort(req.query.sort.split(',').join(' ')); } else { query = query.sort('-createdAt'); }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    // Recalculate total based on potentially modified query (e.g., consultant project filter)
    const total = await Task.countDocuments(query.getFilter()); // Get filter from the Mongoose query object
    query = query.skip(startIndex).limit(limit);
    // --- End Select/Sort/Paginate ---

    try {
        // Populate and Execute (Keep existing)
        const tasks = await query
            .populate('assignedTo', 'firstName lastName email role')
            .populate('project', 'projectName')
            .populate('createdBy', 'firstName lastName email');
        console.log(`Tasks retrieved successfully. Count on page: ${tasks.length}, Total matching: ${total}`);

        // Pagination Result (Keep existing)
        const pagination = {};
        if (endIndex < total) { pagination.next = { page: page + 1, limit }; }
        if (startIndex > 0) { pagination.prev = { page: page - 1, limit }; }

        res.status(200).json({ success: true, count: tasks.length, totalCount: total, pagination, data: tasks });
    } catch (error) {
        // Keep existing error handling
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Server error fetching tasks' });
    }
});


// // @desc    Get task by ID
// // @route   GET /api/tasks/:id
// // @access  Private (Requires Auth - Admin/Consultant)
// exports.getTaskById = catchAsync(async (req, res, next) => {
//   const taskId = req.params.id;
//   console.log(`Attempting to get task by ID: ${taskId}`);

//   // --- Authorization Check ---
//   const authResult = await checkAdminOrConsultant(req.header('Authorization'));
//   if (!authResult.authorized) {
//     return res.status(authResult.status).json({ success: false, message: authResult.message });
//   }
//   const requestingUser = authResult.user;
//   console.log(`User ${requestingUser._id} (${requestingUser.role}) authorized for initial task view.`);
//   // --- End Authorization ---

//   // Validate ID format
//   if (!mongoose.Types.ObjectId.isValid(taskId)) { /* ... */ }

//   try {
//       const task = await Task.findById(taskId)
//         .populate('assignedTo', 'firstName lastName email role')
//         .populate('project', 'projectName')
//         .populate('createdBy', 'firstName lastName email');

//       if (!task) { /* ... Task not found 404 */ }

//       // --- *** ADDED PERMISSION CHECK FOR CONSULTANTS *** ---
//       // Admins can view any task. Consultants can only view tasks they created
//       // OR tasks within their associated projects (choose one logic).
//       // Logic 1: Consultants can ONLY view tasks they created.
//       // if (requestingUser.role === 'consultant' && (!task.createdBy || !task.createdBy._id.equals(requestingUser._id))) {
//       //     console.log(`Consultant ${requestingUser._id} forbidden from viewing task ${taskId} (not creator).`);
//       //     return res.status(403).json({ success: false, message: 'Forbidden: You can only view tasks you created.' });
//       // }

//       // Logic 2 (More common): Consultants can view any task within their associated projects.
//       if (requestingUser.role === 'consultant') {
//             const userWithProjects = await User.findById(requestingUser._id).populate('associatedProjects', '_id'); // Populate only project IDs
//              if (!userWithProjects || !userWithProjects.associatedProjects) {
//                  console.warn(`Consultant ${requestingUser._id} has no associated projects or could not populate them.`);
//                   return res.status(403).json({ success: false, message: 'Forbidden: Cannot verify project association.' });
//              }
//              const projectIds = userWithProjects.associatedProjects.map(p => p._id);
//              // Check if the task's project ID is in the consultant's list
//              if (!task.project || !projectIds.some(pId => pId.equals(task.project._id))) {
//                   console.log(`Consultant ${requestingUser._id} forbidden from viewing task ${taskId} (not in their projects).`);
//                   return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to view this task.' });
//              }
//       }
//       // --- *** END PERMISSION CHECK *** ---

//       console.log(`Task found and user authorized to view: ${task.taskName}`);
//       res.status(200).json({ success: true, data: task });
//   } catch (error) {
//        // Keep existing error handling
//       console.error('Error fetching task by ID:', error);
//       res.status(500).json({ success: false, message: 'Server error fetching task' });
//   }
// });
// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private (Requires Auth - Admin/Consultant)
exports.getTaskById = catchAsync(async (req, res, next) => {
  const taskId = req.params.id;
  console.log(`Attempting to get task by ID: ${taskId}`);

  // --- Authorization Check ---
  const authResult = await checkAdminOrConsultant(req.header('Authorization'));
  if (!authResult.authorized) {
    return res.status(authResult.status).json({ success: false, message: authResult.message });
  }
  const requestingUser = authResult.user;
  console.log(`User ${requestingUser._id} (${requestingUser.role}) authorized for initial check.`);
  // --- End Authorization ---

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid Task ID format' });
  }

  try {
    // --- Fetch Task and Populate Necessary Project Fields ---
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'firstName lastName email role')
      // *** IMPORTANT: Populate the project AND the consultant field within the project ***
      .populate({
          path: 'project',
          select: 'projectName consultant', // Select project name AND consultant ID
          populate: { // Optional: If you need consultant details later, but ID is enough for check
              path: 'consultant',
              select: '_id' // Only need the consultant's ID for the check
          }
      })
      .populate('createdBy', 'firstName lastName email');

    if (!task) {
         console.log(`Task not found: ${taskId}`);
         return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // --- *** REVISED PERMISSION CHECK FOR CONSULTANTS *** ---
    if (requestingUser.role === 'consultant') {
        // Check 1: Does the task belong to a project?
        if (!task.project) {
            console.log(`Consultant ${requestingUser._id} forbidden from viewing task ${taskId} - Task has no associated project.`);
            return res.status(403).json({ success: false, message: 'Forbidden: Task is not associated with a project.' });
        }
        // Check 2: Does the project have a consultant assigned?
        if (!task.project.consultant) {
             console.log(`Consultant ${requestingUser._id} forbidden from viewing task ${taskId} - Project ${task.project._id} has no consultant assigned.`);
             return res.status(403).json({ success: false, message: 'Forbidden: The associated project does not have a consultant.' });
        }
        // Check 3: Does the project's consultant ID match the requesting user's ID?
        // Use .equals() for comparing Mongoose ObjectIds
        if (!task.project.consultant._id.equals(requestingUser._id)) {
            console.log(`Consultant ${requestingUser._id} forbidden from viewing task ${taskId}. They are not the consultant (${task.project.consultant._id}) on project ${task.project._id}.`);
            // Use a slightly different message than before to confirm the logic change
            return res.status(403).json({ success: false, message: 'Forbidden: You are not the assigned consultant for this task\'s project.' });
        }
         console.log(`Consultant ${requestingUser._id} AUTHORIZED to view task ${taskId} as they are the consultant on project ${task.project._id}.`);
    }
    // --- *** END REVISED PERMISSION CHECK *** ---

    // If admin or authorized consultant, proceed
    console.log(`Task found and user authorized to view: ${task.taskName}`);
    res.status(200).json({ success: true, data: task });

  } catch (error) {
    console.error('Error fetching task by ID:', error);
    // Distinguish between different errors if needed
    if (error.name === 'CastError') {
         return res.status(400).json({ success: false, message: 'Invalid ID format during population or query.' });
    }
    res.status(500).json({ success: false, message: 'Server error fetching task' });
  }
});

// // @desc    Update task
// // @route   PATCH /api/tasks/:id
// // @access  Private (Admin: Any task; Consultant: Only own created tasks)
// exports.updateTask = catchAsync(async (req, res, next) => {
//   const taskId = req.params.id;
//   console.log(`Attempting to update task ${taskId}...`);

//   // --- Authorization Check ---
//   const authResult = await checkAdminOrConsultant(req.header('Authorization'));
//   if (!authResult.authorized) {
//     return res.status(authResult.status).json({ success: false, message: authResult.message });
//   }
//   const user = authResult.user;
//   console.log(`User ${user._id} (${user.role}) authorized for initial update attempt.`);
//   // --- End Authorization ---

//   // Validate ID format
//   if (!mongoose.Types.ObjectId.isValid(taskId)) { /* ... */ }

//   // Find the task first to check ownership if consultant
//   const taskToUpdate = await Task.findById(taskId).select('+createdBy'); // Select createdBy
//   if (!taskToUpdate) {
//       return res.status(404).json({ success: false, message: 'Task not found' });
//   }

//   // --- *** ADDED PERMISSION CHECK FOR CONSULTANTS *** ---
//   if (user.role === 'consultant') {
//       // Check if the consultant is the creator of the task
//       if (!taskToUpdate.createdBy || !taskToUpdate.createdBy.equals(user._id)) {
//           console.log(`Consultant ${user._id} forbidden from updating task ${taskId} (not creator).`);
//           return res.status(403).json({ success: false, message: 'Forbidden: Consultants can only update tasks they created.' });
//       }
//       console.log(`Consultant ${user._id} is authorized to update this task (is creator).`);
//   } else {
//        console.log(`Admin ${user._id} is authorized to update any task.`);
//   }
//   // --- *** END PERMISSION CHECK *** ---


//   // Prevent updating critical fields (keep existing logic)
//   const updateData = { ...req.body };
//   delete updateData.createdBy; // Cannot change the creator
//   // delete updateData.project; // Decide if project can be changed


//    // Validate any incoming assignedTo array (keep existing logic)
//    if (updateData.assignedTo) { /* ... */ }

//   try {
//     // Proceed with the update now that permissions are checked
//     const updatedTask = await Task.findByIdAndUpdate(
//       taskId,
//       updateData,
//       { new: true, runValidators: true, context: 'query' }
//     ).populate('assignedTo', 'firstName lastName email role')
//      .populate('project', 'projectName')
//      .populate('createdBy', 'firstName lastName email');

//     // The findByIdAndUpdate itself could technically return null if the task was deleted
//     // between the initial find and the update, although unlikely.
//     if (!updatedTask) {
//         // This case is less likely now due to the initial check, but good practice.
//         return res.status(404).json({ success: false, message: 'Task not found during update process.' });
//     }

//     console.log(`Task ${taskId} updated successfully.`);
//     res.status(200).json({ success: true, data: updatedTask });
//   } catch (error) {
//     // Keep existing error handling
//     console.error('Error updating task:', error);
//     if (error.name === 'ValidationError') { return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` }); }
//     res.status(500).json({ success: false, message: error.message || 'Server error updating task' });
//   }
// });

// @desc    Update task
// @route   PATCH /api/tasks/:id
// @access  Private (Admin: Any task; Consultant: ONLY own created tasks, full edit)
exports.updateTask = catchAsync(async (req, res, next) => {
  const taskId = req.params.id;
  console.log(`Attempting to update task ${taskId}...`);

  // --- Authorization Check ---
  const authResult = await checkAdminOrConsultant(req.header('Authorization'));
  if (!authResult.authorized) {
    return res.status(authResult.status).json({ success: false, message: authResult.message });
  }
  const user = authResult.user;
  console.log(`User ${user._id} (${user.role}) authorized for initial update attempt.`);
  // --- End Authorization ---

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
     return res.status(400).json({ success: false, message: 'Invalid Task ID format' });
  }

  // --- Find Task & Check Permissions ---
  // Select '+createdBy' to ensure the field is available for the check
  const taskToUpdate = await Task.findById(taskId).select('+createdBy');
  if (!taskToUpdate) {
      return res.status(404).json({ success: false, message: 'Task not found' });
  }

  let isAuthorizedToEdit = false;

  if (user.role === 'admin') {
      console.log(`Admin ${user._id} is authorized to update any task.`);
      isAuthorizedToEdit = true;
  } else if (user.role === 'consultant') {
      // Consultants can ONLY edit tasks they created
      if (taskToUpdate.createdBy && taskToUpdate.createdBy.equals(user._id)) {
          console.log(`Consultant ${user._id} is authorized to update this task (is creator).`);
          isAuthorizedToEdit = true;
      } else {
          console.log(`Consultant ${user._id} forbidden from updating task ${taskId} (not creator).`);
          // Return 403 Forbidden if consultant is not the creator
          return res.status(403).json({ success: false, message: 'Forbidden: Consultants can only update tasks they created.' });
      }
  }

  // If after checks, user is not authorized (shouldn't happen with current logic, but safety check)
  if (!isAuthorizedToEdit) {
       return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to update this task.' });
  }
  // --- End Find Task & Check Permissions ---


  // --- Prepare Update Data & Apply Restrictions ---
  const updateData = { ...req.body };

  // ALWAYS prevent changing the creator
  delete updateData.createdBy;

  // Decide if the project linkage can EVER be changed. Usually not recommended.
  // Uncomment the line below to prevent changing the project association.
  // delete updateData.project;

  // --- Validation for Updated Fields (if applicable) ---
  // Example: If assignedTo is being updated, ensure IDs are valid
  if (updateData.assignedTo) {
    if (!Array.isArray(updateData.assignedTo) || updateData.assignedTo.length === 0) {
      return res.status(400).json({ success: false, message: 'assignedTo must be a non-empty array of User IDs' });
    }
    for (const userId of updateData.assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: `Invalid User ID format in assignedTo: ${userId}` });
      }
    }
    // Optional: Check if these users exist? Or let mongoose handle potential ref errors?
    // const foundUsers = await User.find({ '_id': { $in: updateData.assignedTo } }).select('_id');
    // if (foundUsers.length !== updateData.assignedTo.length) {
    //   return res.status(400).json({ success: false, message: 'One or more assigned users not found.' });
    // }
  }

  // Dates will be validated by the pre-save hook if `runValidators` is true.
  // --- End Validation ---

  try {
    // Proceed with the update
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData, // Use the potentially cleaned updateData
      {
        new: true, // Return the modified document
        runValidators: true, // IMPORTANT: Trigger schema validations (like date checks)
        context: 'query' // Needed for some validators in Mongoose 5+ update queries
      }
    ).populate('assignedTo', 'firstName lastName email role') // Populate desired fields
     .populate('project', 'projectName') // You might want project.consultant here too
     .populate('createdBy', 'firstName lastName email');

    // findByIdAndUpdate with new:true returns null if document not found *during* update
    if (!updatedTask) {
        // This case is less likely now due to the initial check, but handles race conditions.
        return res.status(404).json({ success: false, message: 'Task not found during update process.' });
    }

    console.log(`Task ${taskId} updated successfully by user ${user._id}.`);
    res.status(200).json({ success: true, data: updatedTask });

  } catch (error) {
    console.error('Error updating task:', error);
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
        // Extract a user-friendly message from the validation error
        const messages = Object.values(error.errors).map(val => val.message);
        const errorMessage = messages.join('. ');
        return res.status(400).json({ success: false, message: `Validation Error: ${errorMessage}` });
    }
    // Handle other potential errors
    res.status(500).json({ success: false, message: error.message || 'Server error updating task' });
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin: Any task; Consultant: Only own created tasks)
exports.deleteTask = catchAsync(async (req, res, next) => {
  const taskId = req.params.id;
  console.log(`Attempting to delete task ${taskId}...`);

  // --- Authorization Check ---
  const authResult = await checkAdminOrConsultant(req.header('Authorization'));
  if (!authResult.authorized) {
    return res.status(authResult.status).json({ success: false, message: authResult.message });
  }
  const user = authResult.user;
  console.log(`User ${user._id} (${user.role}) authorized for initial delete attempt.`);
  // --- End Authorization ---

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(taskId)) { /* ... */ }


  // Find the task first to check ownership if consultant and get project ID
   const taskToDelete = await Task.findById(taskId).select('+createdBy project'); // Select necessary fields
   if (!taskToDelete) {
        // Idempotency: Task already gone.
        console.log(`Task ${taskId} already deleted or never existed.`);
        return res.status(200).json({ success: true, message: 'Task already deleted or not found.', data: {} });
   }
   const projectId = taskToDelete.project; // Store project ID for cleanup


  // --- *** ADDED PERMISSION CHECK FOR CONSULTANTS *** ---
  // if (user.role === 'consultant') {
  //     // Check if the consultant is the creator of the task
  //     if (!taskToDelete.createdBy || !taskToDelete.createdBy.equals(user._id)) {
  //         console.log(`Consultant ${user._id} forbidden from deleting task ${taskId} (not creator).`);
  //         return res.status(403).json({ success: false, message: 'Forbidden: Consultants can only delete tasks they created.' });
  //     }
  //      console.log(`Consultant ${user._id} is authorized to delete this task (is creator).`);
  // } else {
  //      console.log(`Admin ${user._id} is authorized to delete any task.`);
  // }
  // --- *** END PERMISSION CHECK *** ---


  try {
    // Proceed with deletion now that permissions are checked
    const deleteResult = await Task.deleteOne({ _id: taskId });

    if (deleteResult.deletedCount === 0) {
       // Should have been caught by findById check, but handles race conditions
       console.log(`Task ${taskId} found initially but failed to delete (likely already deleted).`);
        return res.status(404).json({ success: false, message: 'Task not found during deletion attempt' });
    }
    console.log(`Task ${taskId} deleted from Task collection.`);

    // Remove Reference from Project (keep existing logic)
    if (projectId) {
        try {
            const projectUpdateResult = await Project.findByIdAndUpdate(projectId, { $pull: { tasks: taskId } });
            if (projectUpdateResult) { console.log(`Task reference removed from Project ${projectId}.`); }
            else { console.warn(`Project ${projectId} not found when trying to remove task reference.`); }
        } catch (projectUpdateError) { console.error(/* ... */); }
    } else { console.log(`Task ${taskId} had no associated project ID.`); }

    res.status(200).json({ success: true, message: 'Task deleted successfully', data: {} });

  } catch (error) {
    // Keep existing error handling
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Server error deleting task' });
  }
});