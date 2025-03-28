const express = require('express');
const cors = require('cors');
const app = express();

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from this origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies to be sent
}));

// Parse JSON bodies
app.use(express.json());

// Define your routes here
app.use('/api/auth', require('./routes/auth'));

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});