const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const { createAndEmitNotification } = require('../utils/notificationHelper'); // Adjust path if needed

/**
 * Checks for projects ending within the next 30 days and sends notifications.
 * @param {object} io - The Socket.IO server instance.
 */
const checkAndNotifyUpcomingProjectEndDates = async (io) => {
    if (!io) {
        console.error('[Job: Project End Date Notifier] Socket.IO instance is missing!');
        return;
    }

    console.log('[Job: Project End Date Notifier] Running daily check...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(today.getDate() + 30);
        thirtyDaysLater.setHours(23, 59, 59, 999); // End of the 30th day

        // Find projects ending within the next 30 days that are not completed or cancelled
        const upcomingProjects = await Project.find({
            endDate: {
                $gte: today,
                $lte: thirtyDaysLater
            },
            status: { $nin: ['completed', 'cancelled'] } // Adjust status names if different
        }).select('_id projectName endDate contractor consultant projectManager'); // Select needed fields

        if (upcomingProjects.length === 0) {
            console.log('[Job: Project End Date Notifier] No projects ending soon.');
            return;
        }

        console.log(`[Job: Project End Date Notifier] Found ${upcomingProjects.length} projects ending within 30 days.`);

        // Fetch all admin users once
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(admin => admin._id.toString());

        // Process each project
        for (const project of upcomingProjects) {
            // Calculate days remaining
            const timeDiff = project.endDate.getTime() - today.getTime();
            const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            const daysText = daysRemaining <= 1 ? '1 day' : `${daysRemaining} days`;

            // Gather recipients: assigned users + admins
            let recipientIds = [
                project.contractor?.toString(),
                project.consultant?.toString(),
                project.projectManager?.toString(),
                ...adminIds
            ].filter(id => id && mongoose.Types.ObjectId.isValid(id)); // Filter null/invalid and convert admins

            // Ensure unique recipients
            const uniqueRecipientIds = [...new Set(recipientIds)];

            // Send notification to each recipient
            uniqueRecipientIds.forEach(userId => {
                createAndEmitNotification(io, userId, {
                    // senderUser: null, // Or a system user ID if you have one
                    type: 'PROJECT_ENDING_SOON',
                    message: `Project '${project.projectName}' is scheduled to end in ${daysText} (on ${project.endDate.toLocaleDateString()}).`,
                    link: `/projects/${project._id}`, // Link to the project
                    projectId: project._id
                });
            });
        }
        console.log('[Job: Project End Date Notifier] Notifications sent.');

    } catch (error) {
        console.error('[Job: Project End Date Notifier] Error during execution:', error);
    }
};

module.exports = { checkAndNotifyUpcomingProjectEndDates };