const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: [true, 'Please provide the material name'],
    trim: true,
    maxlength: [100, 'Material name cannot exceed 100 characters'] 
  },
  materialType: {
    type: String,
    required: [true, 'Please provide the material type'],
    trim: true,
    maxlength: [50, 'Material type cannot exceed 50 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide the quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Please provide the unit of measurement'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  costPerUnit: {
    type: Number,
    required: [true, 'Please provide the cost per unit'],
    min: [0, 'Cost per unit cannot be negative']
  },
  totalCost: {
    type: Number,
    default: function() {
      return this.quantity * this.costPerUnit; // Automatically calculate total cost
    }
  },
  supplier: {
    type: String,
    required: [true, 'Please provide the supplier name'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Please associate the material with a project']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign the material to a user']
  },
  status: {
    type: String,
    enum: ['ordered', 'delivered', 'in_use', 'depleted'],
    default: 'ordered'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
materialSchema.index({ materialName: 1, status: 1 });
materialSchema.index({ project: 1 });
materialSchema.index({ user: 1 });

// Pre-save middleware to validate material assignment
materialSchema.pre('save', async function(next) {
  const user = await mongoose.model('User').findById(this.user);
  if (!user || !['contractor', 'project_manager'].includes(user.role)) {
    throw new Error('Material can only be assigned to a contractor or project manager');
  }

  const project = await mongoose.model('Project').findById(this.project);
  if (!project) {
    throw new Error('Project not found');
  }

  next();
});

// Post-save middleware to update project budget
materialSchema.post('save', async function(doc) {
  const project = await mongoose.model('Project').findById(doc.project);
  if (!project) return;

  const totalMaterialCost = await mongoose.model('Material')
    .aggregate([
      { $match: { project: doc.project } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
    ]);

  project.projectBudget -= totalMaterialCost[0]?.totalCost || 0;
  await project.save();
});

// Pre-remove middleware to update project budget
materialSchema.pre('remove', async function(next) {
  const project = await mongoose.model('Project').findById(this.project);
  if (!project) return next();

  project.projectBudget += this.totalCost;
  await project.save();
  next();
});


// Add this post-save hook to materialSchema

materialSchema.post('save', async function(doc, next) {
  console.log(`[Material Post-Save Hook] Adding material ${doc._id} to project ${doc.project}`);
  try {
    // Use mongoose.model to avoid potential circular dependencies
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(
      doc.project, // The ID of the project to update
      { $addToSet: { materials: doc._id } } // Add the new material's ID to the 'materials' array
                                            // $addToSet prevents adding duplicates
    );
    console.log(`[Material Post-Save Hook] Successfully added material ${doc._id} to project ${doc.project}`);
    next();
  } catch (error) {
    console.error(`[Material Post-Save Hook] Error adding material ${doc._id} to project ${doc.project}:`, error);
    // Decide if you want to halt further middleware or just log the error
    // If this fails, the material is saved, but the project reference might be missing.
    next(error); // Pass the error along
  }
});

// Add a pre-remove hook to clean up the project array if a material is deleted directly
materialSchema.pre('remove', async function(next) {
    console.log(`[Material Pre-Remove Hook] Removing material ${this._id} from project ${this.project}`);
    try {
        const Project = mongoose.model('Project');
        await Project.findByIdAndUpdate(
            this.project,
            { $pull: { materials: this._id } } // Remove the material's ID
        );
        console.log(`[Material Pre-Remove Hook] Successfully removed material ${this._id} from project ${this.project}`);
        next();
    } catch (error) {
        console.error(`[Material Pre-Remove Hook] Error removing material ${this._id} from project ${this.project}:`, error);
        next(error);
    }
});

module.exports = mongoose.model('Material', materialSchema);