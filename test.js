const mongoose = require('mongoose');

const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/');

const adminUser = new User({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'password1234',
    role: 'admin',
    age: 30,
    phone: '123-456-7890'
  });

// Save the new user to the database
async function createUser() {
    try {
      const user = await adminUser.save();
      console.log('Admin user created:', user);
    } catch (err) {
      console.error(err);
    } finally {
      mongoose.connection.close();
    }
  }
  
  createUser();