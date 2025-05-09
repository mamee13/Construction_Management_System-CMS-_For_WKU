

// server/controllers/projectController.js
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const Project = require('../models/Project');
const User = require('../models/User'); // Assuming User model is in ../models/User
const Material = require('../models/Material'); // Import related models
const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ChatRoom = require('../models/ChatRoom'); // Adjust path if needed
const catchAsync = require('../utils/CatchAsync'); // Assuming you have this utility
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError'); // Assuming you use this
// Import the notification helper (Make sure the path is correct)
const { createAndEmitNotification } = require('../utils/notificationHelper');

// --- Authorization Middleware (isAdminMiddleware - Keep as is) ---
// Note: This middleware should ideally be applied in your router file (e.g., projectRoutes.js), not directly in the controller file.
exports.isAdminMiddleware = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized (no token)' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Use findById(decoded.id) which likely corresponds to user._id
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authorized (user not found)' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin privileges required for this action' });
        }
        req.user = user; // Attach user to request
        next();
    } catch (err) {
        console.error("Auth Error:", err.message);
        return res.status(401).json({ success: false, message: 'Not authorized (token failed)' });
    }
});

// --- CRUD Operations ---

// @desc     Create new project
// @route    POST /api/projects
// @access   Private (Admin only - Use isAdminMiddleware in router)
// exports.createProject = catchAsync(async (req, res, next) => {
//     const {
//         projectName, projectDescription, startDate, endDate, projectLocation,
//         projectBudget, contractor, consultant, projectManager, status
//     } = req.body;

//     // Basic validation (keep as is)
//     if (!projectName || !projectDescription || !startDate || !endDate || !projectLocation || projectBudget === undefined || !contractor || !consultant || !projectManager) {
//         // Use AppError for consistency if you have it setup
//         return next(new AppError('Missing required project fields', 400));
//         // return res.status(400).json({ success: false, message: 'Missing required project fields' });
//     }

//     // --- Added check: Ensure req.user exists (populated by auth middleware) ---
//     if (!req.user || !req.user._id) {
//         console.error('Error in createProject: req.user not found or missing _id. Ensure auth middleware runs first.');
//         return next(new AppError('Authentication error: User information missing.', 500));
//     }
//     // --- End Added check ---

//     const project = await Project.create({
//         projectName, projectDescription, startDate, endDate, projectLocation,
//         projectBudget, contractor, consultant, projectManager, status,
//         // Optional: Explicitly set createdBy if your model has it
//         // createdBy: req.user._id
//     });

//     console.log(`Project created successfully: ${project._id}`);

//     // <<<--- Notification Logic START --->>>
//     const io = req.app.get('socketio'); // Get the io instance from app settings

//     if (io) {
//         const creatorId = req.user._id.toString(); // ID of the admin creating the project

//         // Gather potential recipients (ensure they are valid ObjectIDs if assigned)
//         const potentialRecipients = [
//             project.contractor,
//             project.consultant,
//             project.projectManager
//         ].filter(id => id && mongoose.Types.ObjectId.isValid(id)); // Filter out null/undefined/invalid IDs

//         // Get unique recipient IDs, excluding the creator
//         const uniqueRecipientIds = [...new Set(
//             potentialRecipients
//                 .map(id => id.toString()) // Convert to string for comparison and Set uniqueness
//                 .filter(idStr => idStr !== creatorId) // Exclude the creator
//         )];

//         // Send notification to each involved user (excluding the creator)
//         uniqueRecipientIds.forEach(userId => {
//             createAndEmitNotification(io, userId, {
//                 senderUser: creatorId, // The admin/user who created the project
//                 type: 'USER_ADDED_TO_PROJECT',
//                 message: `You have been assigned to the new project: ${project.projectName}`,
//                 link: `/projects/${project._id}`, // Example frontend link structure
//                 projectId: project._id
//             });
//         });

//         // Optional: Notify *other* admins (if needed)
//         // const adminsToNotify = await User.find({ role: 'admin', _id: { $ne: creatorId } }).select('_id');
//         // adminsToNotify.forEach(admin => {
//         //    createAndEmitNotification(io, admin._id.toString(), { ... notification data ... type: 'NEW_PROJECT_CREATED' });
//         // });

//     } else {
//         // Log a warning if io instance isn't found (might indicate setup issue)
//         console.warn('Socket.IO instance (io) not found in app settings during project creation. Notifications will not be sent.');
//     }
//     // <<<--- Notification Logic END --->>>

//     // Keep the original success response
//     res.status(201).json({
//         success: true,
//         data: project
//     });
// });
// @desc     Create new project
// @route    POST /api/projects
// @access   Private (Admin only - Ensure middleware is applied in router)
exports.createProject = catchAsync(async (req, res, next) => {
    const {
        projectName, projectDescription, startDate, endDate, projectLocation,
        projectBudget, contractor, consultant, projectManager, status
    } = req.body;

    // Basic validation (keep as is)
    if (!projectName || !projectDescription /* ... other fields ... */ ) {
        return next(new AppError('Missing required project fields', 400));
    }
    if (!req.user || !req.user._id) { // Auth check
         return next(new AppError('Authentication error: User information missing.', 500));
    }

    // --- 1. Create the Project ---
    const newProject = await Project.create({
        projectName, projectDescription, startDate, endDate, projectLocation,
        projectBudget, contractor, consultant, projectManager, status,
        // createdBy: req.user._id // If applicable
    });

    console.log(`Project created successfully: ${newProject._id}`); // Keep this log

    // --- 2. Create the Chat Room (Moved Here) ---
    try {
         console.log(`[Project Create Ctrl ${newProject._id}] Attempting to create chat room.`);
         if (!newProject.contractor || !newProject.consultant || !newProject.projectManager) {
              console.warn(`[Project Create Ctrl ${newProject._id}] SKIPPING chat room creation. Missing required roles.`);
         } else {
             const members = [
                 newProject.contractor,
                 newProject.consultant,
                 newProject.projectManager
             ];
             // Optional: Add Admins
             // const admins = await User.find({ role: 'admin' }).select('_id').lean();
             // members.push(...admins.map(a => a._id));

             await ChatRoom.create({
                 projectId: newProject._id,
                 name: `Project: ${newProject.projectName}`,
                 members: [...new Set(members.map(id => id.toString()))]
             });
             console.log(`[Project Create Ctrl ${newProject._id}] Chat room created successfully.`);
         }
    } catch(chatError) {
         console.error(`[Project Create Ctrl ${newProject._id}] ERROR creating chat room after project creation:`, chatError.message, chatError.stack);
         // Decide how to handle chat creation failure - maybe log it but don't fail the whole project creation request?
    }
    // --- End Chat Room Creation ---


    // --- 3. Handle Notifications (Existing Logic) ---
    // This part likely stays similar, using newProject details
    const io = req.app.get('socketio');
    if (io) {
        const creatorId = req.user._id.toString();
        const potentialRecipients = [ /* ... gather recipients from newProject ... */
             newProject.contractor, newProject.consultant, newProject.projectManager
        ].filter(id => id && mongoose.Types.ObjectId.isValid(id));
        const uniqueRecipientIds = [ /* ... filter out creator, ensure unique ... */
             ...new Set(potentialRecipients.map(id => id.toString()).filter(idStr => idStr !== creatorId))
        ];

        uniqueRecipientIds.forEach(userId => {
            createAndEmitNotification(io, userId, {
                senderUser: creatorId,
                type: 'USER_ADDED_TO_PROJECT',
                message: `You have been assigned to the new project: ${newProject.projectName}`,
                link: `/projects/${newProject._id}`,
                projectId: newProject._id
            });
        });
         console.log(`[Project Create Ctrl ${newProject._id}] Notifications initiated.`); // Added log
    } else {
        console.warn('[Project Create Ctrl] Socket.IO instance not found. Notifications not sent.');
    }
    // --- End Notification Logic ---


    // --- 4. Send Response ---
    // Note: The post-save hook for user association WILL STILL RUN after Project.create
    // We just moved the chat creation part out of it.
    res.status(201).json({
        success: true,
        data: newProject // Send back the created project data
    });
});
// --- Keep other controller functions (getProjects, getProject, updateProject, deleteProject, etc.) AS THEY ARE ---
exports.getProjects = catchAsync(async (req, res, next) => {
    const projects = await Project.find()
        // Also add isActive here if needed for list views
        .populate('contractor', 'firstName lastName email isActive')
        .populate('consultant', 'firstName lastName email isActive')
        .populate('projectManager', 'firstName lastName email isActive')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
    });
});

// exports.getProject = catchAsync(async (req, res, next) => {
//     const projectId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(projectId)) {
//         // Use AppError
//          return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
//         // return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
//     }

//     const project = await Project.findById(projectId)
//         .populate('materials') // Populate fully or select fields as needed
//         .populate('schedules') // Populate fully or select fields as needed
//         .populate('tasks')     // Populate fully or select fields as needed
//         .populate({
//             path: 'comments',
//             populate: { path: 'user', select: 'firstName lastName email _id' },
//             options: { sort: { createdAt: -1 } }
//         })
//         // --- MODIFIED POPULATE CALLS TO INCLUDE isActive ---
//         .populate('contractor', 'firstName lastName email phone role _id isActive') // Added isActive
//         .populate('consultant', 'firstName lastName email phone role _id isActive') // Added isActive
//         .populate('projectManager', 'firstName lastName email phone role _id isActive'); // Added isActive
//         // --- END MODIFICATIONS ---

//     if (!project) {
//         // Use AppError
//         return next(new AppError(`Project not found with id ${projectId}`, 404));
//         // return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
//     }

//     // Add a log on the server to confirm isActive is present
//     console.log(`[getProject ${projectId}] Populated data being sent:`, JSON.stringify(project, null, 2));


//     res.status(200).json({
//         success: true,
//         data: project
//     });
// });

exports.getProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;
    const requestingUser = req.user; // User is attached by authMiddleware from the route

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
    }

    // --- Authorization Check: Ensure user is logged in ---
    // This check is technically redundant if authMiddleware is correctly applied in the router,
    // but it's good practice for robustness.
    if (!requestingUser || !requestingUser._id) {
        console.error(`[getProject ${projectId}] Error: User information missing from request. Ensure authMiddleware ran.`);
        return next(new AppError('Authentication required to view project details.', 401));
    }
    // --- End Auth Check ---


    const project = await Project.findById(projectId)
        // Keep existing populations
        .populate('materials')
        .populate('schedules')
        .populate('tasks')
        .populate({
            path: 'comments',
            populate: { path: 'user', select: 'firstName lastName email _id' },
            options: { sort: { createdAt: -1 } }
        })
        .populate('contractor', 'firstName lastName email phone role _id isActive')
        .populate('consultant', 'firstName lastName email phone role _id isActive')
        .populate('projectManager', 'firstName lastName email phone role _id isActive');


    if (!project) {
        return next(new AppError(`Project not found with id ${projectId}`, 404));
    }

    // --- Authorization Logic: Check if user is admin or assigned ---
    const userIdStr = requestingUser._id.toString();
    const contractorIdStr = project.contractor?._id?.toString(); // Use optional chaining safely
    const consultantIdStr = project.consultant?._id?.toString();
    const projectManagerIdStr = project.projectManager?._id?.toString();

    const isAssigned =
        userIdStr === contractorIdStr ||
        userIdStr === consultantIdStr ||
        userIdStr === projectManagerIdStr;

    // Allow access if user is admin OR assigned to the project
    if (requestingUser.role === 'admin' || requestingUser.role === 'committee' || isAssigned) {
        // User is authorized, send the project data
        console.log(`[getProject ${projectId}] Authorized access for user ${userIdStr} (Role: ${requestingUser.role}, Assigned: ${isAssigned})`);
        console.log(`[getProject ${projectId}] Populated data being sent:`, JSON.stringify(project, null, 2)); // Keep your log
        res.status(200).json({
            success: true,
            data: project // Send the fully populated project
        });
    } else {
        // User is logged in but not authorized for THIS project
        console.warn(`[getProject ${projectId}] Unauthorized access attempt by user ${userIdStr}. Not admin or assigned.`);
        return next(new AppError('You do not have permission to view this specific project.', 403)); // Use 403 Forbidden
    }
});

exports.updateProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;
     if (!mongoose.Types.ObjectId.isValid(projectId)) {
         // Use AppError
         return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
        // return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
    }

    // It's better practice to use the findById + save() pattern for updates
    // if you rely on Mongoose middleware (like your post('save') hook).
    // Let's keep findByIdAndUpdate for now as per your original code,
    // but be aware its limitations regarding middleware.

    const updateData = { ...req.body };
    // Prevent modification of arrays/managed fields via main update route
    delete updateData.materials;
    delete updateData.schedules;
    delete updateData.tasks;
    delete updateData.comments;
    // Also protect fields like createdAt, updatedAt, _id, __v
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;


    const project = await Project.findByIdAndUpdate(projectId, updateData, {
        new: true,           // Return the modified document
        runValidators: true  // Run schema validators
    });

    if (!project) {
        // Use AppError
        return next(new AppError(`Project not found with id ${projectId}`, 404));
        // return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
    }

    console.log(`Project updated successfully (using findByIdAndUpdate): ${project._id}`);
    // WARNING: Your 'post("save")' hook DID NOT run here. User associations might be stale if contractor/consultant/pm changed.
    res.status(200).json({
        success: true,
        data: project
    });
});

exports.deleteProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        // Use AppError
        return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
        // return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
    }

    console.log(`Attempting to find project for deletion: ${projectId}`);
    // Find the project first to get its details (like user IDs)
    const project = await Project.findById(projectId);

    if (!project) {
        console.log(`Project not found for deletion: ${projectId}`);
        // Use AppError
        return next(new AppError(`Project not found with id ${projectId}`, 404));
        // return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
    }

    console.log(`Project found: ${projectId}. Starting manual cascade delete process.`);

    try {
        // --- MANUAL CASCADE DELETE ---
        const operations = [
            // 1. Delete related documents from other collections
            Material.deleteMany({ project: projectId }).exec(),
            Schedule.deleteMany({ project: projectId }).exec(),
            Task.deleteMany({ project: projectId }).exec(),
            Comment.deleteMany({ project: projectId }).exec(),
        ];

        // 2. Remove project reference from associated users
        // Use $pull to remove the projectId from the associatedProjects array in User documents
        if (project.contractor) {
            operations.push(User.findByIdAndUpdate(project.contractor, { $pull: { associatedProjects: projectId } }).exec());
        }
        if (project.consultant) {
            operations.push(User.findByIdAndUpdate(project.consultant, { $pull: { associatedProjects: projectId } }).exec());
        }
        if (project.projectManager) {
            operations.push(User.findByIdAndUpdate(project.projectManager, { $pull: { associatedProjects: projectId } }).exec());
        }

        // Execute all deletion and update operations concurrently
        console.log(`Executing ${operations.length} related delete/update operations...`);
        const results = await Promise.all(operations);
        console.log("Related data deletion/update results:", results.map(r => r?.deletedCount || r?.modifiedCount || r)); // Log counts

        // --- DELETE THE PROJECT ITSELF ---
        console.log(`Related data cleaned up. Deleting project document: ${projectId}`);
        const deletedProjectResult = await Project.findByIdAndDelete(projectId);

        if (!deletedProjectResult) {
           console.error(`Failed to delete project ${projectId} after cleaning related data.`);
            // Use AppError
           return next(new AppError('Project found but failed to delete after cleanup.', 500));
            // return res.status(500).json({ success: false, message: 'Project found but failed to delete after cleanup.' });
        }


        console.log(`Project ${projectId} and related data deleted successfully (manual cascade).`);
        res.status(200).json({
            success: true,
            message: 'Project and related data deleted successfully.',
            data: { deletedId: projectId }
        });

    } catch (error) {
        console.error(`Error during manual cascade delete for project ${projectId}:`, error);
         // Use AppError
        return next(new AppError(`Failed to delete project and related data: ${error.message}`, 500));
        //  return res.status(500).json({ success: false, message: `Failed to delete project and related data: ${error.message}` });
    }
});

exports.getProjectsByConsultantId = catchAsync(async (req, res, next) => {
    const consultantId = req.params.consultantId;

    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
        // Use AppError
        return next(new AppError(`Invalid consultant ID format: ${consultantId}`, 400));
        // return res.status(400).json({ success: false, message: `Invalid consultant ID format: ${consultantId}` });
    }

    // Optional: Add authorization check - Ensure the logged-in user IS the consultant or an admin
    // if (req.user.role !== 'admin' && req.user._id.toString() !== consultantId) {
    //     // Use AppError
    //    return next(new AppError('Not authorized to view these projects', 403));
    //   // return res.status(403).json({ success: false, message: 'Not authorized to view these projects' });
    // }

    const projects = await Project.find({ consultant: consultantId })
        .populate('contractor', 'firstName lastName email isActive')
        .populate('consultant', 'firstName lastName email isActive') // Still populate consultant info if needed elsewhere
        .populate('projectManager', 'firstName lastName email isActive') // Populate PM for display
        .sort({ createdAt: -1 }); // Sort by creation date, newest first

    if (!projects) {
        // find() returns empty array, not null, if nothing found. This check might not be needed.
        // Use AppError
        return next(new AppError(`No projects found for consultant ${consultantId}`, 404));
        // return res.status(404).json({ success: false, message: `No projects found for consultant ${consultantId}` });
    }

    // Match the structure expected by the frontend: { data: { projects: [...] } }
    res.status(200).json({
        success: true,
        count: projects.length,
        data: { projects: projects } // Nest projects inside a 'projects' key within 'data'
    });
});

exports.getMyAssignedProjects = catchAsync(async (req, res, next) => {
    // Ensure auth middleware has run and populated req.user.id (or req.user._id)
    // Use req.user._id if that's what your auth middleware provides
    const userId = req.user._id;

    if (!userId) {
        // Should ideally be caught by 'protect' middleware, but added as a safeguard
        // Use AppError
        return next(new AppError('Not authorized (user ID not found)', 401));
        // return res.status(401).json({ success: false, message: 'Not authorized (user ID not found)' });
    }

    // Find projects where the user is listed as contractor, consultant, or projectManager
    const projects = await Project.find({
        $or: [
            { contractor: userId },
            { consultant: userId },
            { projectManager: userId }
            // Add other roles here if they imply project assignment, e.g., committee members
            // { committeeMembers: userId } // Example if you have such a field
        ]
    })
    .select('_id projectName status projectLocation startDate endDate projectBudget projectDescription') // Select only needed fields for lists/dropdowns
    .sort({ projectName: 1 }); // Sort alphabetically by name

    res.status(200).json({
        success: true,
        count: projects.length,
        data: { projects: projects } // Nest projects in 'data' object for consistency
    });
});