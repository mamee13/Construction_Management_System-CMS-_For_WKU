import React, { useState, useEffect } from 'react';
import { Typography, Spin } from 'antd';
import { BuildingOfficeIcon, UserGroupIcon, ClipboardDocumentListIcon, CubeIcon } from "@heroicons/react/24/outline";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const CommitteeDashboard = () => {
  const [counts, setCounts] = useState({
    projects: 0,
    activeProjects: 0,
    reports: 0,
    pendingReports: 0,
    team: 0,
    activeTeam: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('wku_cms_token');
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [projectsRes, reportsRes, teamRes] = await Promise.all([
          axios.get('/api/projects', { headers }),
          axios.get('/api/reports', { headers }),
          axios.get('/api/users', { headers })
        ]);

        const activeProjects = projectsRes.data.data.filter(p => p.status === 'active').length;
        const pendingReports = reportsRes.data.data.filter(r => r.status === 'pending').length;
        const activeTeam = teamRes.data.data.users.filter(u => u.status === 'active').length;

        setCounts({
          projects: projectsRes.data.data.length,
          activeProjects,
          reports: reportsRes.data.data.length,
          pendingReports,
          team: teamRes.data.data.users.length,
          activeTeam
        });

        setRecentProjects(projectsRes.data.data.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatCards = () => [
    {
      name: 'Projects',
      total: counts.projects,
      active: counts.activeProjects,
      icon: BuildingOfficeIcon,
      color: 'bg-indigo-600',
    },
    {
      name: 'Reports',
      total: counts.reports,
      pending: counts.pendingReports,
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-600',
    },
    {
      name: 'Team Members',
      total: counts.team,
      active: counts.activeTeam,
      icon: UserGroupIcon,
      color: 'bg-yellow-600',
    }
  ];

  if (loading) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-12 w-12 rounded-md bg-gray-200 mb-4"></div>
              <div className="h-6 w-24 bg-gray-200 mb-2 rounded"></div>
              <div className="h-10 w-16 bg-gray-200 mb-2 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Committee Dashboard</h1>
        <p className="text-gray-500">
          Here's an overview of all projects and activities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {getStatCards().map((stat) => (
          <div 
            key={stat.name} 
            className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:bg-gray-50"
            onClick={() => {
              if (stat.name === 'Projects') {
                navigate('/committee-projects');
              } else if (stat.name === 'Reports') {
                navigate('/committee-reports');
              } else if (stat.name === 'Team Members') {
                navigate('/committee-team');
              }
            }}
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
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Projects</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {recentProjects.length === 0 ? (
              <li className="px-6 py-4 text-gray-500">No recent projects found.</li>
            ) : (
              recentProjects.map((project) => (
                <li key={project._id}>
                  <a
                    onClick={() => navigate(`/committee-projects/${project._id}`)}
                    className="block hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {project.projectName}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <UserGroupIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            {project.projectManager?.firstName} {project.projectManager?.lastName}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            Started {new Date(project.startDate).toLocaleDateString()}
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
    </div>
  );
};

export default CommitteeDashboard;