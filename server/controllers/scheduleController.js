const Schedule = require('../models/Schedule');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const asyncHandler = require('express-async-handler');

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
// @route   POST /api/projects/:projectId/schedules
// @access  Private (Admin/Contractor/Consultant/Committee)
const createSchedule = asyncHandler(async (req, res) => {
  console.log('Creating schedule');
  const { projectId } = req.params;
  const {
    scheduleName,
    scheduleDescription,
    startDate,
    endDate,
    task,
    assignedTo,
    status,
    priority
  } = req.body;

  // Validate required fields
  if (!scheduleName || !scheduleDescription || !startDate || !endDate || !task || !assignedTo) {
    return res.status(400).json({
      message:
        'Required fields: scheduleName, scheduleDescription, startDate, endDate, task, assignedTo'
    });
  }

  // Validate existence of project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
 
  // Validate existence of task
  const taskDoc = await Task.findById(task);
  if (!taskDoc) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Validate assigned user
  const user = await User.findById(assignedTo);
  if (!user) {
    return res.status(404).json({ message: 'Assigned user not found' });
  }

  try {
    const schedule = await Schedule.create({
      scheduleName,
      scheduleDescription,
      startDate,
      endDate,
      task,
      assignedTo,
      project: projectId,
      status: status || 'planned',
      priority: priority || 'medium'
    });

    // Optionally add schedule to project's schedules array if supported
    // await Project.findByIdAndUpdate(
    //   projectId,
    //   { $addToSet: { schedules: schedule._id } },
    //   { new: true }
    // );

    console.log('Schedule created:', schedule);
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update a schedule
// @route   PATCH /api/schedules/:id
// @access  Private (Admin/Assigned User)
const updateSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const schedule = await Schedule.findById(id);
  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }

  // Authorization check: allow if admin or if the schedule is assigned to the authenticated user
  if (req.user.role !== 'admin' && schedule.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this schedule' });
  }

  // Prevent non-admin users from updating protected fields
  if (req.user.role !== 'admin') {
    delete updates.assignedTo;
    delete updates.project;
    delete updates.task;
  }

  try {
    const updatedSchedule = await Schedule.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });
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

  // Authorization check
  if (req.user.role !== 'admin' && schedule.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this schedule' });
  }

  try {
    // Optionally remove schedule from project's schedules array if supported
    // await Project.findByIdAndUpdate(
    //   schedule.project,
    //   { $pull: { schedules: schedule._id } },
    //   { new: true }
    // );

    await schedule.remove();
    res.status(200).json({
      message: 'Schedule deleted successfully',
      deletedId: schedule._id
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = {
  getSchedulesForProject,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
