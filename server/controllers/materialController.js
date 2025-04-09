

// controllers/materialController.js
const mongoose = require('mongoose'); // Required for ObjectId validation
const Material = require('../models/Material');
const Project = require('../models/Project'); // Required for the new query
const User = require('../models/User');
const asyncHandler = require('express-async-handler'); // Or your preferred async wrapper
const AppError = require('../utils/AppError'); // Assuming you use this for errors

/**
 * @desc    Get materials, filtered by role (admin sees all, contractor sees assigned projects)
 * Optionally filters further by a specific project ID via query param.
 * @route   GET /api/materials?project=projectId
 * @access  Private (Requires Authentication via middleware)
 */
const getMaterials = asyncHandler(async (req, res, next) => {
    // --- Essential Prerequisite: Authentication ---
    if (!req.user || !req.user._id || !req.user.role) {
        console.error("[getMaterials] CRITICAL: req.user not found or incomplete. Ensure auth middleware runs first.");
        return next(new AppError('Authentication required. User information missing.', 401)); // Use AppError
    }

    console.log(`[getMaterials] Request START - User: ${req.user._id}, Role: ${req.user.role}, QueryParams:`, req.query);

    const projectId = req.query.project; // Specific project filter from query params
    let query = {}; // Mongoose query object for Materials

    // --- Logic Branching based on User Role and Project Filter ---

    if (projectId) {
        // --- CASE 1: A specific project filter IS provided ---
        console.log(`[getMaterials] Filtering for specific project ID: ${projectId}`);

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
             return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
        }

        // Validate project existence
        const projectExists = await Project.findById(projectId).lean();
        if (!projectExists) {
            console.log(`[getMaterials] Project ${projectId} not found. Returning empty list.`);
            return res.status(200).json({ success: true, data: [] });
        }

        // Authorization: Check if contractor is allowed to see this specific project
        if (req.user.role === 'contractor') {
            // Verify using the Project document itself
            const projectToCheck = await Project.findOne({
                 _id: projectId,
                 $or: [
                     { contractor: req.user._id },
                     { consultant: req.user._id },
                     { projectManager: req.user._id }
                 ]
             }).lean();

             if (!projectToCheck) {
                 console.warn(`[getMaterials] Forbidden: Contractor ${req.user._id} attempted to access project ${projectId} they are not assigned to (contractor/consultant/pm).`);
                 return next(new AppError('Not authorized to view materials for this specific project', 403));
             }
             console.log(`[getMaterials] Contractor ${req.user._id} authorized for specific project ${projectId}.`);
        }
        // Admins are implicitly allowed if the project exists

        query.project = projectId; // Add the specific project filter to the Material query

    } else {
        // --- CASE 2: NO specific project filter provided ---
        console.log(`[getMaterials] No specific project filter. Filtering based on user role.`);

        if (req.user.role === 'contractor') {
            // --- MODIFICATION START (Solution 2) ---
            // Query Project collection directly instead of User.associatedProjects
            console.log(`[getMaterials] Contractor ${req.user._id} detected. Finding assigned projects directly from Project collection...`);

            const assignedProjects = await Project.find({
                // Find projects where this user is in any relevant role field
                $or: [
                    { contractor: req.user._id },
                    { consultant: req.user._id },
                    { projectManager: req.user._id }
                    // Add other roles here if necessary, e.g., { committeeMembers: req.user._id }
                ]
            }).select('_id').lean(); // Fetch only the project IDs

            if (!assignedProjects || assignedProjects.length === 0) {
                 console.log(`Contractor ${req.user._id} has no assigned projects (based on direct Project collection query). Returning empty list.`);
                return res.status(200).json({ success: true, data: [] }); // Return empty list if no projects found
            }

            // Map the results to get an array of project ID strings
            const assignedProjectIds = assignedProjects.map(p => p._id.toString());
            console.log(`[getMaterials] Contractor ${req.user._id} assigned Project IDs (from Project query):`, assignedProjectIds);

            // Build the query to find materials for these projects
            query.project = { $in: assignedProjectIds };
            // --- MODIFICATION END (Solution 2) ---

        } else if (req.user.role === 'admin') {
            // Admin sees all materials when no specific project filter is applied
            console.log(`[getMaterials] Admin ${req.user._id} fetching all materials.`);
            // query remains {} (empty), fetching all materials

        } else {
            // Handle other unexpected roles if necessary, or deny access
            console.warn(`[getMaterials] Forbidden: User ${req.user._id} with unhandled role '${req.user.role}' tried to access materials.`);
             return next(new AppError('Your role does not permit viewing materials.', 403));
        }
    }

    // --- Execute the Material Query ---
    console.log(`[getMaterials] FINAL Mongoose Query for Materials (User ${req.user._id}):`, JSON.stringify(query, null, 2));

    try {
        const materials = await Material.find(query)
            .populate('user', 'firstName lastName role') // Populate user details who added material
            .populate('project', 'projectName')       // Populate project name for display
            .sort({ createdAt: -1 })                  // Sort by creation date descending
            .lean();                                  // Use lean() for performance

        console.log(`[getMaterials] Mongoose query executed. Found ${materials.length} materials for User ${req.user._id}.`);

        // --- Send Response ---
        res.status(200).json({ success: true, data: materials });

    } catch (dbError) {
         console.error(`[getMaterials] Database Error during Material.find for user ${req.user._id} with query ${JSON.stringify(query)}:`, dbError);
         return next(new AppError('Server error fetching materials.', 500)); // Use AppError
    }
});

/**
 * @desc    Get a single material by ID
 * @route   GET /api/materials/:id
 * @access  Private (Requires Authentication)
 */
const getMaterialById = asyncHandler(async (req, res, next) => {
    // --- Auth check (essential) ---
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const materialId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(materialId)) {
        return next(new AppError(`Invalid material ID format: ${materialId}`, 400));
    }

    const material = await Material.findById(materialId)
        .populate('user', 'firstName lastName role')
        .populate('project', 'projectName _id') // Populate project ID for auth check
        .lean();

    if (!material) {
        return next(new AppError(`Material not found with id ${materialId}`, 404));
    }

    // --- Authorization Check ---
    // Allow Admin OR user assigned to the material's project
    if (req.user.role !== 'admin') {
         if (!material.project || !material.project._id) {
             console.warn(`[getMaterialById] Material ${materialId} has no associated project. Denying access to non-admin ${req.user._id}`);
             return next(new AppError('Cannot determine project assignment for this material.', 403));
         }
         // Check if the user is assigned to this material's project
        const projectAssignment = await Project.findOne({
            _id: material.project._id,
            $or: [
                { contractor: req.user._id },
                { consultant: req.user._id },
                { projectManager: req.user._id }
            ]
        }).select('_id').lean(); // Just need to know if it exists

        if (!projectAssignment) {
             console.warn(`[getMaterialById] Forbidden: User ${req.user._id} attempted to access material ${materialId} from project ${material.project._id} they are not assigned to.`);
             return next(new AppError('Not authorized to view this specific material', 403));
        }
    } // Admins allowed

    res.status(200).json({ success: true, data: material });
});

/**
 * @desc    Create a new material
 * @route   POST /api/materials
 * @access  Private (Requires Authentication - Admin or Contractor)
 */
const createMaterial = asyncHandler(async (req, res, next) => {
    // --- Auth check (essential) ---
    if (!req.user) return next(new AppError('Authentication required.', 401));

    // Ensure only appropriate roles can create
    if (!['admin', 'contractor'].includes(req.user.role)) {
        return next(new AppError('Not authorized to create materials', 403));
    }

    console.log(`[createMaterial] User ${req.user._id} (Role: ${req.user.role}) attempting creation. Body:`, req.body);

    // --- Use req.user._id as the creator ---
    const creatingUserId = req.user._id;

    const { project: projectId, materialName, quantity, unit, costPerUnit, supplier, materialType, status } = req.body;

    // --- Validations ---
    if (!projectId || !materialName || quantity == null || !unit || costPerUnit == null || !supplier || !materialType) {
        return next(new AppError('Missing required fields (project, name, quantity, unit, cost, supplier, type)', 400));
    }
     if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
    }

    // Validate Project Existence
    const projectExists = await Project.findById(projectId).lean();
    if (!projectExists) {
        return next(new AppError(`Project not found with ID: ${projectId}`, 404)); // Use 404 or 400
    }

    // --- Authorization: If contractor, ensure they are assigned to this project ---
     if (req.user.role === 'contractor') {
        // Check project assignment directly
         const projectAssignment = await Project.findOne({
             _id: projectId,
             $or: [
                 { contractor: req.user._id },
                 { consultant: req.user._id },
                 { projectManager: req.user._id }
             ]
         }).select('_id').lean();

        if (!projectAssignment) {
             console.warn(`[createMaterial] Forbidden: Contractor ${req.user._id} attempted to create material for project ${projectId} they are not assigned to.`);
             return next(new AppError('You can only add materials to projects you are assigned to.', 403));
        }
    } // Admins allowed

    // Calculate totalCost
    const numQuantity = Number(quantity);
    const numCostPerUnit = Number(costPerUnit);
    if (isNaN(numQuantity) || numQuantity < 0 || isNaN(numCostPerUnit) || numCostPerUnit < 0) {
         return next(new AppError('Invalid numeric value (must be non-negative) for quantity or costPerUnit.', 400));
    }
    const calculatedTotalCost = numQuantity * numCostPerUnit;

    try {
        const newMaterial = await Material.create({
            project: projectId,
            user: creatingUserId, // Use authenticated user's ID
            materialName,
            quantity: numQuantity,
            unit,
            costPerUnit: numCostPerUnit,
            totalCost: calculatedTotalCost,
            supplier,
            materialType,
            status: status || 'ordered'
        });

        // Populate the created material for the response
        const populatedMaterial = await Material.findById(newMaterial._id)
            .populate('user', 'firstName lastName role')
            .populate('project', 'projectName')
            .lean();

        console.log('[createMaterial] Material created successfully:', populatedMaterial?._id);
        res.status(201).json({ success: true, data: populatedMaterial });

    } catch (error) {
        console.error('[createMaterial] Error:', error);
        if (error.name === 'ValidationError') {
            // Extract a more user-friendly message if possible
            const messages = Object.values(error.errors).map(val => val.message);
            const message = messages.join('. ');
            return next(new AppError(`Validation Error: ${message}`, 400));
        }
        return next(new AppError('Server error creating material.', 500)); // Generic error
    }
});

/**
 * @desc    Update a material
 * @route   PATCH /api/materials/:id
 * @access  Private (Requires Authentication - Owner or Admin)
 */
const updateMaterial = asyncHandler(async (req, res, next) => {
    // --- Auth check (essential) ---
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const materialId = req.params.id;
     if (!mongoose.Types.ObjectId.isValid(materialId)) {
        return next(new AppError(`Invalid material ID format: ${materialId}`, 400));
    }

    const { quantity, costPerUnit, ...updateData } = req.body;

    // Prevent updating certain fields directly
    delete updateData.project; // Don't allow changing project association here
    delete updateData.user; // Don't allow changing the original creator
    delete updateData.totalCost; // Recalculated below
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;

    // Find the material - Don't use lean here as we need the .save() method
    const material = await Material.findById(materialId);
    if (!material) {
        return next(new AppError(`Material not found with id ${materialId}`, 404));
    }

    // --- Authorization Check: Allow Owner or Admin ---
    const isOwner = material.user.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
        console.warn(`[updateMaterial] Forbidden: User ${req.user._id} tried to update material ${materialId} owned by ${material.user}.`);
        return next(new AppError('Not authorized to update this material', 403));
    }

    // Apply updates from request body
    Object.assign(material, updateData);

    // Recalculate totalCost if quantity or costPerUnit are present and changed
    let needsRecalculation = false;
    let newQuantity = material.quantity;
    let newCostPerUnit = material.costPerUnit;

    if (quantity !== undefined) {
        const numQuantity = Number(quantity);
        if (isNaN(numQuantity) || numQuantity < 0) return next(new AppError('Invalid quantity provided (must be non-negative).', 400));
        if (numQuantity !== material.quantity) {
            material.quantity = numQuantity;
            newQuantity = numQuantity;
            needsRecalculation = true;
        }
    }
     if (costPerUnit !== undefined) {
        const numCostPerUnit = Number(costPerUnit);
         if (isNaN(numCostPerUnit) || numCostPerUnit < 0) return next(new AppError('Invalid costPerUnit provided (must be non-negative).', 400));
        if (numCostPerUnit !== material.costPerUnit) {
            material.costPerUnit = numCostPerUnit;
            newCostPerUnit = numCostPerUnit;
            needsRecalculation = true;
        }
    }

    if (needsRecalculation) {
        material.totalCost = newQuantity * newCostPerUnit;
    }

    try {
        // Use save() to trigger Mongoose middleware/validation if any exist on Material schema
        const savedMaterial = await material.save();

        // Populate the response data
        const populatedMaterial = await Material.findById(savedMaterial._id)
           .populate('user', 'firstName lastName role')
           .populate('project', 'projectName')
           .lean();

        console.log('[updateMaterial] Material updated successfully:', savedMaterial._id);
        res.status(200).json({ success: true, data: populatedMaterial });
    } catch (error) {
        console.error('[updateMaterial] Error:', error);
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             const message = messages.join('. ');
             return next(new AppError(`Validation Error: ${message}`, 400));
        }
        return next(new AppError('Server error updating material.', 500));
    }
});

/**
 * @desc    Delete a material
 * @route   DELETE /api/materials/:id
 * @access  Private (Requires Authentication - Owner or Admin)
 */
const deleteMaterial = asyncHandler(async (req, res, next) => {
     // --- Auth check (essential) ---
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const materialId = req.params.id;
     if (!mongoose.Types.ObjectId.isValid(materialId)) {
        return next(new AppError(`Invalid material ID format: ${materialId}`, 400));
    }
    console.log(`[deleteMaterial] Request received for ID: ${materialId} by User: ${req.user._id}, Role: ${req.user.role}`);

    // Find the material to check ownership
    const material = await Material.findById(materialId).select('user'); // Only need user field for auth check
    if (!material) {
        console.log(`[deleteMaterial] Material ${materialId} not found.`);
        return next(new AppError(`Material not found with id ${materialId}`, 404));
    }

    // --- Authorization Check: Allow Owner or Admin ---
    const isOwner = material.user.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
        console.warn(`[deleteMaterial] Forbidden: User ${req.user._id} tried to delete material ${materialId} owned by ${material.user}.`);
        return next(new AppError('Not authorized to delete this material', 403));
    }

    try {
        // Use deleteOne for efficiency if no 'remove' hooks needed on Material schema
        const deleteResult = await Material.deleteOne({ _id: materialId });

        if (deleteResult.deletedCount === 0) {
             // Should have been caught by findById check, but added as safeguard
             console.warn(`[deleteMaterial] Material ${materialId} found initially but delete operation reported 0 deleted.`);
             return next(new AppError('Material could not be deleted.', 500));
        }

        console.log(`[deleteMaterial] Material ${materialId} deleted successfully.`);

        res.status(200).json({
            success: true,
            message: 'Material deleted successfully',
            deletedId: materialId
        });
    } catch (error) {
        console.error(`[deleteMaterial] Error deleting material ${materialId}:`, error);
         return next(new AppError('Server error deleting material.', 500));
    }
});

// --- Export all controller functions ---
module.exports = {
    getMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
};