const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide your first name'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please provide your last name'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    match: [
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
      'Please provide a valid email address'
    ],
    lowercase: true,
    index: true
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'contractor', 'consultant', 'project_manager', 'committee'],
      message: 'Invalid user role'
    },
    required: [true, 'Please select a role']
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  sex: {
    type: String,
    enum: ['male', 'female']
  },
  age: {
    type: Number,
    min: [18, 'Age must be at least 18']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  associatedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  isActive: {
    type: Boolean,
    default: true
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


// Add virtual properties for role checks
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

userSchema.virtual('isContractor').get(function() {
  return this.role === 'contractor';
});

userSchema.virtual('isConsultant').get(function() {
  return this.role === 'consultant';
});

userSchema.virtual('isProject_manager').get(function() {
  return this.role === 'project_manager';
});

userSchema.virtual('isCommittee').get(function() {
  return this.role === 'committee';
});




// Encrypt user password before saving user to the database
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });
  // Generate JWT token for user authentication and authorization purposes
  userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
      { id: this._id, role: this.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  };

  // Compare user password with hashed password in the database
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  const userRoles = ['admin', 'contractor', 'consultant', 'project_manager', 'committee'];

userRoles.forEach(role => {
  userSchema.virtual(`is${role.charAt(0).toUpperCase() + role.slice(1)}`).get(function() {
    return this.role === role;
  });
});

userSchema.index({ email: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);