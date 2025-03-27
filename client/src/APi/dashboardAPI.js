
import projectsAPI from "./projects";
import tasksAPI from "./tasks";
import usersAPI from "./users";
import schedulesAPI from "./schedules";

const extractArray = (response) => {
  // If the response is already an array, return it.
  if (Array.isArray(response)) return response;
  // If response.data is an array, use that.
  if (response && Array.isArray(response.data)) return response.data;
  // Otherwise, return an empty array as fallback.
  return [];
};

const getDashboardStats = async () => {
  try {
    // Fetch data concurrently
    const [projectsRes, tasksRes, usersRes, schedulesRes] = await Promise.all([
      projectsAPI.getAllProjects(),
      tasksAPI.getTasks(),
      usersAPI.getAllUsers(),
      schedulesAPI.getAllSchedules(),
    ]);

    // Safely extract arrays from the API responses
    const projects = extractArray(projectsRes);
    const tasks = extractArray(tasksRes);
    const users = extractArray(usersRes);
    const schedules = extractArray(schedulesRes);

    // Calculate project stats:
    // We consider projects with status "in_progress" as active.
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (project) => project.status === "in_progress"
    ).length;

    // Calculate task stats:
    // Assuming each task has a boolean property "completed"
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'completed').length;

    // Calculate user stats:
    // Assuming each user has an "isActive" property
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.isActive).length;

    // Calculate schedule stats:
    // Count all schedules and pending schedules (status !== "completed")
    const totalSchedules = schedules.length;
    const pendingSchedules = schedules.filter(
      (schedule) => schedule.status === "completed"
    ).length;
    
    return {
      projects: { total: totalProjects, active: activeProjects },
      tasks: { total: totalTasks, completed: completedTasks },
      users: { total: totalUsers, active: activeUsers },
      schedules: { total: totalSchedules, pending: pendingSchedules },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

export default { getDashboardStats };
