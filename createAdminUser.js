const mongoose = require('mongoose');
const User = require('./server/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Update the password without hashing, pre-save hook will handle hashing
      existingAdmin.password = 'admin123';
      await existingAdmin.save();
      
      console.log('Admin password updated successfully');
      return;
    }
    
    // Create new admin without manual hashing
    const newAdmin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'admin123',  // Pre-save hook will hash this
      role: 'admin',
      age: 30,
      phone: '123-456-7890'
    });
    
    console.log('Admin user created successfully:', newAdmin);
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    mongoose.disconnect();
  }
};

createAdminUser();
