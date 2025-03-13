const mongoose = require('mongoose');
const User = require('./server/models/User');

mongoose.connect('mongodb://localhost:27017/');

async function getAllUsers() {
  try {
    const users = await User.find();
    console.log('All users:', users);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

getAllUsers();