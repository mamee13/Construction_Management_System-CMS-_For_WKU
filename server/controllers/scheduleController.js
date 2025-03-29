const Schedule = require('../models/Schedule');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

// @desc    Get all schedules for a project
// @route   GET /api/projects/:projectId/schedules
// @access  Public (Admin/Contractor/Consultant/Committee)
const getSchedulesForProject = asyncHandler(async (req, res) => {
  console.log('Fetching schedules for project');
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const schedules = await Schedule.find({ project: projectId })
    .populate('assignedTo', 'firstName lastName role')
    .populate('task', 'taskName')
    .sort('-createdAt');

  res.status(200).json(schedules);
});



// @desc    Create a new schedule
// @route   POST /api/schedules
// @access  Private (Admin/Contractor/Consultant/Committee)
const createSchedule = asyncHandler(async (req, res) => {
  console.log('Creating schedule');

  // Expect project id to come from the request body now
  const {
    scheduleName,
    scheduleDescription,
    startDate,
    endDate,
    task,
    assignedTo,
    project,  // <-- project id now comes from body instead of req.params
    status,
    priority
  } = req.body;
 console.log('Received request to create schedule:',req.body);
  // Validate required fields
  if (!scheduleName || !scheduleDescription || !startDate || !endDate || !task || !assignedTo || !project) {
    return res.status(400).json({
      message:
        'Required fields: scheduleName, scheduleDescription, startDate, endDate, task, assignedTo, project'
    });
  }
console.log("reciving")
  // Validate existence of project
  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    return res.status(404).json({ message: 'Project not found' });
  }
 console.log("project is valid")
  // Validate existence of task
  const taskDoc = await Task.findById(task);
  if (!taskDoc) {
    return res.status(404).json({ message: 'Task not found' });
  }
  console.log("task is valid")
  // Validate assigned user
  const user = await User.findById(assignedTo);
  if (!user) {
    return res.status(404).json({ message: 'Assigned user not found' });
  }
console.log("user is valid")
  try {
    const schedule = await Schedule.create({
      scheduleName,
      scheduleDescription,
      startDate,
      endDate,
      task,
      assignedTo,
      project, // assign project id from body
      status: status || 'planned',
      priority: priority || 'medium'
    });

    console.log('Schedule created:', schedule);
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// @desc    Update a schedule
// @route   PATCH /api/schedules/:scheduleId
// @access  Private (Admin or Assigned User)
const updateSchedule = asyncHandler(async (req, res) => {
  console.log("0");
  const token = req.header('Authorization').replace('Bearer ', '');
  console.log("1");
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("2");
  const user = await User.findById(decoded.id);
  console.log("3");

  // Only an admin can update schedule (or modify logic to allow assigned user)
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this schedule.'
    });
  }

  console.log('Updating schedule');
  const { scheduleId } = req.params;
  const updates = req.body;
  console.log("schedule id is", scheduleId);

  // Retrieve the document
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }

  // Authorization check: allow if admin or if the schedule is assigned to the authenticated user
  // if (user.role !== 'admin' && schedule.assignedTo.toString() !== user._id.toString()) {
  //   return res.status(403).json({ message: 'Not authorized to update this schedule' });
  // }

  // // Prevent non-admin users from updating protected fields
  // if (user.role !== 'admin') {
  //   delete updates.assignedTo;
  //   delete updates.project;
  //   delete updates.task;
  // }

  // Update the schedule document fields
  Object.keys(updates).forEach((key) => {
    schedule[key] = updates[key];
  });

  try {
    // Save the document to trigger validation with proper document context
    const updatedSchedule = await schedule.save();
    res.status(200).json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});




// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Private (Admin or Assigned User)
const deleteSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('Deleting schedule:', id);

  const schedule = await Schedule.findById(id);
  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }

  //Authorization check
  // if (req.user.role !== 'admin' && schedule.assignedTo.toString() !== req.user._id.toString()) {
  //   return res.status(403).json({ message: 'Not authorized to delete this schedule' });
  // }
  console.log('Schedule found, proceeding with deletion');
  try {
    // Optionally remove schedule from project's schedules array if supported
    await Project.findByIdAndUpdate(
      schedule.project,
      { $pull: { schedules: schedule._id } },
      { new: true }
    );

    // await schedule.remove();
    await schedule.deleteOne();
    res.status(200).json({
      message: 'Schedule deleted successfully',
      deletedId: schedule._id
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all schedules (across projects)
// @route   GET /api/schedules
// @access  Public (Admin/Contractor/Consultant/Committee)
const getAllSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find()
    .populate('project', 'projectName')
    .populate('assignedTo', 'firstName lastName role')
    .populate('task', 'taskName')
    .sort('-createdAt');
  res.status(200).json({ schedules });
});


// @desc    Get a schedule by ID
// @route   GET /api/schedules/:id
// @access  Public (or appropriate role)
const getScheduleById = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  console.log('Fetching schedule by ID:', scheduleId);
  const schedule = await Schedule.findById(scheduleId)
    .populate('project', 'projectName')
    .populate('assignedTo', 'firstName lastName role')
    .populate('task', 'taskName');
  
  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }
  console.log('Schedule found:', schedule);
  
  res.status(200).json(schedule);
});

module.exports = {
  getSchedulesForProject,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAllSchedules,
  getScheduleById
};
