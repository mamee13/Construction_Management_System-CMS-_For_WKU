

const Material = require('../models/Material');
const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('express-async-handler'); // Or your catchAsync utility

// @desc    Get materials (optionally filtered by project)
// @route   GET /api/materials?project=projectId
// @access  Public (Adjust access control as needed, e.g., using middleware)
const getMaterials = asyncHandler(async (req, res) => {
  console.log('Fetching materials, query:', req.query);
  const projectId = req.query.project; // Get project ID from query parameter

  let query = {}; // Base query (find all)

  if (projectId) {
    // Validate if the project exists (optional but good practice)
    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      // Decide behavior: error or empty list? Returning empty list is often preferred for filters.
      console.log(`Project ${projectId} not found, returning empty material list.`);
      return res.status(200).json({ success: true, data: [] }); // Return success with empty data
      // OR: return res.status(404).json({ success: false, message: 'Project not found' });
    }
    query.project = projectId; // Add project filter to the query
  } else {
    // If no project filter, you might want to restrict access
    // depending on user role if you're fetching *all* materials.
    // Example (requires auth middleware):
    if (req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Not authorized to view all materials' });
    }
    console.log('No project filter applied, fetching all accessible materials.');
  }

  // Find materials based on the constructed query
  const materials = await Material.find(query)
    .populate('user', 'firstName lastName role') // Populate user details
    .sort('-createdAt'); // Sort by creation date descending

  // **IMPORTANT**: Return the data in the structure your frontend expects.
  // If your previous code worked with `select: (data) => data?.data`, wrap the array:
  res.status(200).json({ success: true, data: materials });
  // If your frontend expects the array directly (after robust select), send just the array:
  // res.status(200).json(materials);
});

// @desc    Get a single material by ID
// @route   GET /api/materials/:id
// @access  Public (Adjust access control as needed)
const getMaterialById = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id)
    .populate('user', 'firstName lastName role')
    .populate('project', 'projectName'); // Optionally populate project details

  if (!material) {
    return res.status(404).json({ success: false, message: 'Material not found' });
  }

  // Return in expected structure
  res.status(200).json({ success: true, data: material });
});


// @desc    Create a new material
// @route   POST /api/materials
// @access  Private (Adjust access control as needed, e.g., using middleware)
const createMaterial = asyncHandler(async (req, res) => {
  console.log('Creating material, body:', req.body);
  // Project ID MUST now be in the request body
  const { project: projectId, user: userId, materialName, quantity, unit, costPerUnit, supplier, materialType, status } = req.body;

  // --- Essential Validations ---
  if (!projectId || !userId || !materialName || quantity == null || !unit || costPerUnit == null || !supplier || !materialType) {
     // Be more specific with error messages in production
    return res.status(400).json({ success: false, message: 'Missing required material fields (project, user, name, quantity, unit, costPerUnit, supplier, type)' });
  }

  // Validate existence of project and user
  const projectExists = await Project.findById(projectId);
  if (!projectExists) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  const userExists = await User.findById(userId);
  if (!userExists) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  // Add role check if necessary (requires auth middleware ideally)
  // if (!req.user || !['admin', 'contractor'].includes(req.user.role)) {
  //    return res.status(403).json({ message: 'User not authorized to create materials' });
  // }

  // Calculate totalCost (handle potential non-numeric inputs)
  const calculatedTotalCost = Number(quantity) * Number(costPerUnit);
  if (isNaN(calculatedTotalCost)) {
      return res.status(400).json({ success: false, message: 'Invalid quantity or costPerUnit provided.' });
  }

  try {
    // Create the material using fields from req.body
    const material = await Material.create({
        project: projectId,
        user: userId,
        materialName,
        quantity: Number(quantity),
        unit,
        costPerUnit: Number(costPerUnit),
        totalCost: calculatedTotalCost, // Use calculated value
        supplier,
        materialType,
        status: status || 'ordered' // Default status if not provided
    });
    const populatedMaterial = await Material.findById(material._id)
                                   .populate('user', 'firstName lastName role'); // Populate user for response


    console.log('Material created:', populatedMaterial);

    // Optionally add the material reference to the project's materials array if you use that
    // await Project.findByIdAndUpdate(
    //   projectId,
    //   { $addToSet: { materials: material._id } }, // Use $addToSet to avoid duplicates
    //   { new: true }
    // );

    // Return in expected structure
    res.status(201).json({ success: true, data: populatedMaterial });

  } catch (error) {
    console.error('Error creating material:', error);
    // Mongoose validation errors have a specific structure
    if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: error.message, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error creating material', error: error.message });
  }
});

// @desc    Update a material
// @route   PATCH /api/materials/:id
// @access  Private (Adjust access control - owner or admin?)
const updateMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, costPerUnit, ...updateData } = req.body; // Separate quantity/cost

  const material = await Material.findById(id);
  if (!material) {
    return res.status(404).json({ success: false, message: 'Material not found' });
  }

  // --- Authorization Check --- (Requires auth middleware ideally)
  // Example: Allow owner or admin to update
  // if (!req.user || (!material.user.equals(req.user._id) && req.user.role !== 'admin')) {
  //   return res.status(403).json({ message: 'Not authorized to update this material' });
  // }

  // Update fields provided in the body
  Object.assign(material, updateData);

  // Recalculate totalCost if quantity or costPerUnit changed
  let needsRecalculation = false;
  if (quantity !== undefined && Number(quantity) !== material.quantity) {
      material.quantity = Number(quantity);
      needsRecalculation = true;
  }
   if (costPerUnit !== undefined && Number(costPerUnit) !== material.costPerUnit) {
      material.costPerUnit = Number(costPerUnit);
      needsRecalculation = true;
  }
  if (needsRecalculation) {
       const newTotalCost = Number(material.quantity) * Number(material.costPerUnit);
       if (isNaN(newTotalCost)) {
           return res.status(400).json({ success: false, message: 'Invalid quantity or costPerUnit resulting in invalid total cost.' });
       }
       material.totalCost = newTotalCost;
  }


  try {
    const savedMaterial = await material.save(); // Use save() to trigger Mongoose middleware/validation
    const populatedMaterial = await Material.findById(savedMaterial._id)
                                     .populate('user', 'firstName lastName role');

    console.log('Material updated:', populatedMaterial);
    // Return in expected structure
    res.status(200).json({ success: true, data: populatedMaterial });
  } catch (error) {
     console.error('Error updating material:', error);
     if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: error.message, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error updating material', error: error.message });
  }

});

// @desc    Delete a material
// @route   DELETE /api/materials/:id
// @access  Private (Requires Authentication - Owner or Admin)
const deleteMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // --- 1. Ensure user is authenticated (Middleware should handle this) ---
  // req.user should be populated by your authMiddleware
  if (!req.user || !req.user._id) {
     console.error("Authentication error: req.user not found in deleteMaterial. Ensure authMiddleware is applied.");
     // Middleware should ideally send 401, but added here as a safeguard
     return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  console.log(`[Delete Request] User: ${req.user._id}, Role: ${req.user.role}, Material ID: ${id}`);

  // --- 2. Find the material to be deleted ---
  const material = await Material.findById(id);
  if (!material) {
    console.log(`[Delete Request] Material ${id} not found.`);
    return res.status(404).json({ success: false, message: 'Material not found' });
  }
  console.log(`[Delete Request] Found material: ${material.materialName}, Owned by: ${material.user}`);

  // --- 3. Authorization Check: Allow if user is ADMIN or the OWNER ---
  const isOwner = material.user.equals(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && !isOwner) {
    // If the user is NOT an admin AND is NOT the owner
    console.warn(`[Delete Request] Authorization Failed: User ${req.user._id} (Role: ${req.user.role}) is not admin and does not own material ${id} (Owner: ${material.user})`);
    return res.status(403).json({ success: false, message: 'Not authorized to delete this material' });
  }

  console.log(`[Delete Request] Authorization Succeeded for user ${req.user._id}. Is Admin: ${isAdmin}, Is Owner: ${isOwner}.`);

  // --- 4. Proceed with deletion ---
  try {
    // Use deleteOne() for efficiency if 'remove' hooks aren't critical.
    // Use material.remove() if Mongoose pre/post 'remove' middleware needs to run (e.g., budget updates).
    await Material.deleteOne({ _id: id });
    // await material.remove(); // <--- Use this if you have 'remove' middleware hooks

    console.log(`[Delete Request] Material ${id} deleted successfully.`);

    // Optional: Update the project's budget or material list if needed
    // (This might be better handled by the pre/post 'remove' hook in the model)
    // await Project.findByIdAndUpdate(material.project, { $pull: { materials: id } });

    // --- 5. Send Success Response ---
    res.status(200).json({
        success: true,
        message: 'Material deleted successfully',
        deletedId: id // Send back the ID for potential frontend use
    });

  } catch(error) {
     console.error(`[Delete Request] Error during deletion of material ${id}:`, error);
     res.status(500).json({ success: false, message: 'Server error deleting material', error: error.message });
  }
});

module.exports = {
  getMaterials,
  getMaterialById, // Export new function
  createMaterial,
  updateMaterial,
  deleteMaterial
};