const express = require('express');
const app = express();
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');
const materialRoutes=require('./routes/materialRoutes')
const taskRoutes = require('./routes/taskRoutes');



app.use(express.json());

// app.use(errorMiddleware);

app.get('/', (req, res) => {
    res.send('API is running');
  });
// Middleware to parse JSON bodies

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', commentRoutes);
app.use('/api',materialRoutes )
app.use('/api', taskRoutes);


app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
  
app.use(globalErrorHandler);

module.exports = app;