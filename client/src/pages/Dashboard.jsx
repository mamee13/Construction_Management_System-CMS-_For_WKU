import { useEffect, useState } from "react";
import { BuildingOfficeIcon, UserGroupIcon, ClipboardDocumentListIcon, CubeIcon } from "@heroicons/react/24/outline";
import authAPI from "@/APi/auth";
import dashboardAPI from "@/APi/dashboardAPI";
import projectsAPI from "@/APi/projects";
import { useNavigate } from "react-router-dom";
// Update the import
import { getSchedulesCount, getUsersCount } from '@/APi/countAPI';

const Dashboard = () => {
  const navigate = useNavigate(); // Add this line near the top of the component
  const [stats, setStats] = useState({
    projects: { total: 0, active: 0 },
    users: { total: 0, active: 0 },
    tasks: { total: 0, completed: 0 },
    schedules: { total: 0, pending: 0 },
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user from auth API
  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch aggregated dashboard stats
        const data = await dashboardAPI.getDashboardStats();
        
        // Get schedules and users count with detailed information
        const schedulesData = await getSchedulesCount();
        const usersData = await getUsersCount();
        
        // Fetch all projects then sort and pick latest 3
        const projectsRes = await projectsAPI.getAllProjects();
        const projects = Array.isArray(projectsRes)
          ? projectsRes
          : projectsRes.data || [];
        const sortedProjects = projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Update stats with new counts while keeping other data
        setStats({
          ...data,
          users: {
            total: usersData.total,
            active: usersData.active
          },
          schedules: {
            total: schedulesData.total,
            pending: schedulesData.pending
          }
        });

        setRecentProjects(sortedProjects.slice(0, 3));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare stat cards based on user role
  const getStatCards = () => {
    const userRole = currentUser?.role;
    const allStats = [
      {
        name: "Projects",
        icon: BuildingOfficeIcon,
        total: stats.projects.total,
        active: stats.projects.active,
        color: "bg-indigo-500",
        roles: ["admin", "consultant", "contractor", "project_manager", "committee"],
        path: "/admin/projects"
      },
      {
        name: "Users",
        icon: UserGroupIcon,
        total: stats.users.total,
        active: stats.users.active,
        color: "bg-blue-500",
        roles: ["admin"],
        path: "/admin/users"
      },
      {
        name: "Tasks",
        icon: ClipboardDocumentListIcon,
        total: stats.tasks.total,
        completed: stats.tasks.completed,
        percentage: Math.round((stats.tasks.completed / (stats.tasks.total || 1)) * 100),
        color: "bg-green-500",
        roles: ["admin", "contractor", "project_manager"],
        path: "/admin/tasks"
      },
      {
        name: "Schedules",
        icon: CubeIcon,
        total: stats.schedules.total,
        pending: stats.schedules.pending,
        color: "bg-yellow-500",
        roles: ["admin", "contractor", "project_manager"],
        path: "/admin/schedules"
      },
    ];

    return allStats.filter((stat) => stat.roles.includes(userRole));
  };

  // Update the card rendering section
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {currentUser?.firstName}! Here's what's happening with your projects.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-12 w-12 rounded-md bg-gray-200 mb-4"></div>
              <div className="h-6 w-24 bg-gray-200 mb-2 rounded"></div>
              <div className="h-10 w-16 bg-gray-200 mb-2 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {getStatCards().map((stat) => (
              <div 
                key={stat.name} 
                onClick={() => navigate(stat.path)}
                className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{stat.total}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  {stat.name === "Projects" && (
                    <div className="text-sm">
                      <span className="font-medium text-green-600">{stat.active} active</span>{" "}
                      <span className="text-gray-500">
                        projects ({Math.round((stat.active / (stat.total || 1)) * 100)}%)
                      </span>
                    </div>
                  )}
                  {stat.name === "Users" && (
                    <div className="text-sm">
                      <span className="font-medium text-green-600">{stat.active} active</span>{" "}
                      <span className="text-gray-500">
                        users ({Math.round((stat.active / (stat.total || 1)) * 100)}%)
                      </span>
                    </div>
                  )}
                  {stat.name === "Tasks" && (
                    <div className="text-sm">
                      <span className="font-medium text-green-600">{stat.completed} completed</span>{" "}
                      <span className="text-gray-500">tasks ({stat.percentage}%)</span>
                    </div>
                  )}
                  {stat.name === "Schedules" && (
                    <div className="text-sm">
                      <span className="font-medium text-yellow-600">{stat.pending} pending</span>{" "}
                      <span className="text-gray-500">approval</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Recent projects section */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Projects</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {recentProjects.length === 0 ? (
                  <li className="px-6 py-4 text-gray-500">No recent projects found.</li>
                ) : (
                  recentProjects.map((project) => (
                    <li key={project._id}>
                      <a href={`/projects/${project._id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {project.projectName}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  project.status === "in_progress"
                                    ? "bg-green-100 text-green-800"
                                    : project.status === "completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                {project.projectLocation || "Location"}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Created:{" "}
                                <time dateTime={project.createdAt}>
                                  {new Date(project.createdAt).toLocaleDateString()}
                                </time>
                              </p>
                            </div>
                          </div>
                        </div>
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Additional dashboard widgets can go here, customized per role */}
    </div>
  );
};

export default Dashboard;
