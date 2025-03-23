// cleanupDuplicateUsers.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

// Log the MongoDB URI (with password masked for security)
const maskedUri = process.env.MONGODB_URI 
  ? process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')
  : 'MongoDB URI not found';
console.log('Connecting to:', maskedUri);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected successfully");
    await cleanupDuplicateUsers();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Define User schema directly in this script to avoid path issues
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  age: Number,
  associatedProjects: Array,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual properties
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

// Create User model
const User = mongoose.model('User', userSchema);

const cleanupDuplicateUsers = async () => {
  try {
    console.log('Starting cleanup process...');
    
    // Ensure the connection is established
    await mongoose.connection.db.command({ ping: 1 });
    
    // List all collections in the database to verify we're connected to the right one
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
    // Check if users collection exists
    const userCollectionExists = collections.some(c => c.name === 'users');
    console.log('Users collection exists:', userCollectionExists);
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} total users`);
    
    if (users.length === 0) {
      console.log('No users found. Checking raw MongoDB collection...');
      
      // Try to query the raw collection
      const rawUsers = await mongoose.connection.db.collection('users').find({}).toArray();
      console.log(`Found ${rawUsers.length} users in raw collection`);
      
      if (rawUsers.length > 0) {
        console.log('Sample user from raw collection:', rawUsers[0]);
      }
      
      if (rawUsers.length === 0) {
        console.log('No users found in the database. Please check your database connection and collection name.');
        return;
      }
      
      // Process the raw users
      console.log('Processing users from raw collection...');
      
      // Track emails we've seen
      const emailsProcessed = {};
      const usersToDelete = [];
      
      // Sort users by createdAt (keep the most recent)
      rawUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Identify duplicates
      rawUsers.forEach(user => {
        if (!user.email) {
          console.log('User without email:', user._id);
          return;
        }
        
        const email = user.email.toLowerCase().trim();
        
        if (emailsProcessed[email]) {
          // This is a duplicate, mark for deletion
          usersToDelete.push(user._id);
        } else {
          // First time seeing this email
          emailsProcessed[email] = true;
        }
      });
      
      console.log(`Found ${usersToDelete.length} duplicate users to delete`);
      
      // Delete the duplicates
      if (usersToDelete.length > 0) {
        const result = await mongoose.connection.db.collection('users')
          .deleteMany({ _id: { $in: usersToDelete } });
        console.log(`Deleted ${result.deletedCount} duplicate users`);
      }
      
      // Verify the cleanup
      const remainingUsers = await mongoose.connection.db.collection('users').find({}).toArray();
      console.log(`Remaining users: ${remainingUsers.length}`);
      
      // List the remaining users
      console.log('Remaining users:');
      remainingUsers.forEach(user => {
        console.log(`- ${user.email} (${user._id})`);
      });
      
      return;
    }
    
    // If we found users through the model, proceed with normal cleanup
    // Track emails we've seen
    const emailsProcessed = {};
    const usersToDelete = [];
    
    // Sort users by createdAt (oldest first, so we'll keep the newest)
    users.sort((a, b) => a.createdAt - b.createdAt);
    
    // Identify duplicates
    users.forEach(user => {
      if (!user.email) {
        console.log('User without email:', user._id);
        return;
      }
      
      const email = user.email.toLowerCase().trim();
      
      if (emailsProcessed[email]) {
        // This is a duplicate, mark for deletion
        usersToDelete.push(user._id);
      } else {
        // First time seeing this email
        emailsProcessed[email] = true;
      }
    });
    
    console.log(`Found ${usersToDelete.length} duplicate users to delete`);
    
    // Delete the duplicates
    if (usersToDelete.length > 0) {
      const result = await User.deleteMany({ _id: { $in: usersToDelete } });
      console.log(`Deleted ${result.deletedCount} duplicate users`);
    }
    
    // Verify the cleanup
    const remainingUsers = await User.find({});
    console.log(`Remaining users: ${remainingUsers.length}`);
    
    // List the remaining users
    console.log('Remaining users:');
    remainingUsers.forEach(user => {
      console.log(`- ${user.email} (${user._id})`);
    });
    
  } catch (error) {
    console.error('Error cleaning up duplicate users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Remove the direct call to cleanupDuplicateUsers here
// cleanupDuplicateUsers();