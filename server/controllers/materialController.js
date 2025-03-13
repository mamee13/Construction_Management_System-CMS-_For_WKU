const Material = require('../models/Material');
const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all materials for a project
// @route   GET /api/projects/:projectId/materials
// @access  Public (Admin/Contractor/Consultant/Committee)
const getMaterialsForProject = asyncHandler(async (req, res) => {
  console.log('Fetching materials for project');
  const { projectId } = req.params;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Find materials associated with the project
  const materials = await Material.find({ project: projectId })
    .populate('user', 'firstName lastName role')
    .sort('-createdAt');

  res.status(200).json(materials);
});

// @desc    Create a new material
// @route   POST /api/projects/:projectId/materials
// @access  Private (Admin/Contractor/Consultant/Committee)
const createMaterial = asyncHandler(async (req, res) => {
  console.log('Creating material');
  const { projectId } = req.params;
  const { materialName, user: userId } = req.body;

  // Validate existence of project and user
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Validate material name
  if (!materialName) {
    console.error('Material name is required');
    return res.status(400).json({ message: 'Material name is required' });
  }

  try {
    // Create the material
    const material = await Material.create(req.body);

    console.log('Material created:', material);

    // Optionally add the material reference to the project's materials array
    await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { materials: material._id } },
      { new: true }
    );

    console.log('Material added to project:', projectId);
    res.status(201).json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update a material
// @route   PATCH /api/materials/:id
// @access  Private (Material owner only)
const updateMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { materialName } = req.body;

  if (!materialName) {
    return res.status(400).json({ message: 'Material name is required' });
  }

  const material = await Material.findById(id);
  if (!material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  // Ensure the authenticated user is the owner of the material
  if (!material.user.equals(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to update this material' });
  }

  const updatedMaterial = await Material.findByIdAndUpdate(
    id,
    { materialName, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedMaterial);
});

// @desc    Delete a material
// @route   DELETE /api/materials/:id
// @access  Private (Material owner or Admin)
const deleteMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id)

  const material = await Material.findById(id);
  console.log('2')
  if (!material) {
    return res.status(404).json({ message: 'Material not found' });
  }
  console.log(material)

  // Allow deletion if the user is the owner or an admin
  if (!material.user.equals(req.body.user) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this material' });
  }
  console.log('3')
  // Remove the material from the project's materials array
//   await Project.findByIdAndUpdate(
//     material.project,
//     { $pull: { materials: material._id } },
//     { new: true }
//   );

  await Material.deleteOne(material);
  console.log('4')
  res.status(200).json({ 
    message: 'Material deleted successfully',
    deletedId: material._id
  });
});

module.exports = {
  getMaterialsForProject,
  createMaterial,
  updateMaterial,
  deleteMaterial
};
