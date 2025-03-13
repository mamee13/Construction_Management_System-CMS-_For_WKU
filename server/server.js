// backend/server.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');



dotenv.config({ path: './Config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Start the server
const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});