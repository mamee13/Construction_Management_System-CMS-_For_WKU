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

module.exports = mongoose.model('Material', materialSchema);