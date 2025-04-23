

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import authAPI from "./APi/auth"

// Layouts
import MainLayout from "./components/layout/MainLayOut"
import AdminLayout from "./components/layout/AdminLayout"

// Auth pages
import LoginForm from "./components/Auth/LoginForm"
import LoginDebug from "./pages/auth/LoginDebug"

// User pages
import Dashboard from "./pages/Dashboard"
import Profile from "./pages/Profile"

// Admin pages
import UsersList from "./pages/admin/UsersList"
import UserRegistration from "./pages/admin/UserRegistration"
import ProjectsList from "./pages/admin/projects/ProjectsList"
import CreateProject from "./pages/admin/projects/CreateProject"
import ProjectDetail from "./pages/admin/projects/ProjectDetail"
import EditProject from "./pages/admin/projects/EditProject"
import ProjectUpdateDebug from "./pages/admin/projects/ProjectUpdateDebug"
import SchedulesList from "./pages/Admin/schedules/SchedulesList"
import CreateSchedule from "./pages/admin/schedules/CreateSchedule"
import EditSchedule from "./pages/admin/schedules/EditSchedule"
import ScheduleDetail from "./pages/admin/schedules/ScheduleDetail"

import TasksList from "./pages/admin/tasks/TasksList"
import CreateTask from "./pages/admin/tasks/CreateTask"
import TaskDetail from "./pages/admin/tasks/TaskDetail"
import EditTask from "./pages/admin/tasks/EditTask"
import CreateReportForAdmin from "./pages/Admin/reports/CreateReport"

// Admin Material Management Pages
// import MaterialsList from "./pages/admin/materials/MaterialsList"
// import CreateMaterial from "./pages/admin/materials/CreateMaterial"
// import EditMaterial from "./pages/admin/materials/EditMaterial"
// import MaterialDetail from "./pages/admin/materials/MaterialDetail"
import ReportList from "./pages/Admin/reports/ReportList"
import ReportDetailAdmin from "./pages/Admin/reports/ReportDetail"

//Consultant Pages
import ConsultantProjects from "./pages/Consultant/projects"
import ConsultantProjectDetail from "./pages/Consultant/ConsultantProjectDetail"
//consultant Reporrt Pages
// import CreateReportPage from "./pages/Report/CreateReportPage"
// import ReportListPage from "./pages/Report/ReportListPage"
// import ReportDetailPage from "./pages/Report/ReportDetailPage"
import CreateReport from "./pages/Consultant/reports/CreateReport"
import ReportDetail from "./pages/Consultant/reports/ReportDetail"
import ReportsList from "./pages/Consultant/reports/ReportsList"
import EditReport from "./pages/Consultant/reports/EditReport"
import ConsultantTaskDetail from "./pages/Consultant/tasks/TaskDetail"
import ConsultantCreateTask from "./pages/Consultant/tasks/CreateTask"
import ConsultantTasksList from "./pages/Consultant/tasks/TasksList"
import ConsultantEditTask from "./pages/Consultant/tasks/EditTask"
import ConsultantCreateSchedule from "./pages/Consultant/schedules/ConsultantCreateSchedule"
import ConsultantSchedulesDashboard from "./pages/Consultant/schedules/ConsultantSchedulesDashboard"
import ConsultantEditSchedule from "./pages/Consultant/schedules/ConsultantEditSchedule"
import ConsultantScheduleDetail from "./pages/Consultant/schedules/ConsultantScheduleDetail"
//Contractor Pages is here
import MaterialDetail from "./pages/Contractor/material/MaterialDetail"
import MaterialsList from "./pages/Contractor/material/MaterialsList"
import CreateMaterial from "./pages/Contractor/material/CreateMaterial"
import EditMaterial from "./pages/Contractor/material/EditMaterial"
import ProjectsListForContractor from "./pages/Contractor/projects/ProjectsList"
import ProjectDetailForContractor from "./pages/Contractor/projects/ProjectDetail"
import ReportsListForContractor from "./pages/Contractor/reports/ReportsList"
import CreateReportForContractor from "./pages/Contractor/reports/CreateReport"
import ReportDetailForContractor from "./pages/Contractor/reports/ReportDetail"
import Analytics from "./pages/Admin/Analytics"
// Committee Pages
import CommitteeDashboard from "./pages/Committee/CommitteeDashboard";
import CommitteeProjectsList from "./pages/Committee/projects/ProjectsList";
import CommitteeProjectDetail from "./pages/Committee/projects/ProjectDetail";
import CommitteeReportsList from "./pages/Committee/reports/ReportsList";
import CommitteeReportDetail from "./pages/Committee/reports/ReportDetail";
import CommitteeTeamList from "./pages/Committee/team/TeamList";
import CommitteeTeamDetail from "./pages/Committee/team/TeamDetail";
// Protected route component
import ChatPage from "./pages/Chat/ChatPage"
import ProjectsListForProjectManager from "./pages/ProjectManager/ProjectsList"
import ProjectManagerProjectDetail from "./pages/ProjectManager/ProjectDetail"
import ReportDetailForProjectManager from "./pages/ProjectManager/ReportDetail"
import ReportListForProjectManager from "./pages/ProjectManager/ReportList"
import CreateReportForProjectManager from "./pages/ProjectManager/CreateReport"
const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = authAPI.isAuthenticated();
  const user = authAPI.getCurrentUser();
  const userRole = user?.role;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasRequiredRole = requiredRole ? authAPI.hasRole(requiredRole) : true;

  if (requiredRole && !hasRequiredRole) {
    const redirectPath = getDashboardPathByRole(userRole);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Move these functions before the App component
const getDashboardPathByRole = (role) => {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'consultant':
      return '/consultant-dashboard';
    case 'contractor':
      return '/contractor-dashboard';
    case 'project_manager':
      return '/projectmanager-dashboard';
    case 'committee':
      return '/committee-dashboard';
    default:
      return '/dashboard';
  }
};

const RootRedirector = () => {
  const user = authAPI.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const dashboardPath = getDashboardPathByRole(user.role);
  return <Navigate to={dashboardPath} replace />;
};

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/login-debug" element={<LoginDebug />} />

        {/* User routes with MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Existing routes */}
          <Route index element={<RootRedirector />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="chat" element={<ChatPage />} />

          {/* Committee routes */}
          <Route path="committee-dashboard" element={<ProtectedRoute requiredRole="committee"><CommitteeDashboard /></ProtectedRoute>} />
          <Route path="committee-projects" element={<ProtectedRoute requiredRole="committee"><CommitteeProjectsList /></ProtectedRoute>} />
          <Route path="committee-projects/:id" element={<ProtectedRoute requiredRole="committee"><CommitteeProjectDetail /></ProtectedRoute>} />
          <Route path="committee-reports" element={<ProtectedRoute requiredRole="committee"><CommitteeReportsList /></ProtectedRoute>} />
          <Route path="committee-reports/:id" element={<ProtectedRoute requiredRole="committee"><CommitteeReportDetail /></ProtectedRoute>} />
          <Route path="committee-team" element={<ProtectedRoute requiredRole="committee"><CommitteeTeamList /></ProtectedRoute>} />
          <Route path="committee-team/:id" element={<ProtectedRoute requiredRole="committee"><CommitteeTeamDetail /></ProtectedRoute>} />
          {/* Add more user routes as needed */}
          {/*consultant route is this  */}
          <Route
            path="projects" // Renders at /projects
            element={
              <ProtectedRoute requiredRole="consultant">
                <ConsultantProjects />
              </ProtectedRoute>
            }
          />
          <Route
          path="projects/:id" // Renders at /projects/:id
          element={
            <ProtectedRoute requiredRole="consultant">
              <ConsultantProjectDetail />
            </ProtectedRoute>
          }
          />
          <Route
           path="reports" // Renders at /reports
           element={
            <ProtectedRoute requiredRole="consultant">
              <ReportsList />
            </ProtectedRoute>

           }
           />
           <Route
           path="reports/create" // Renders at /reports
           element={
            <ProtectedRoute requiredRole="consultant">
              <CreateReport />
            </ProtectedRoute>

           }
           />
            <Route
           path="reports/:id" // Renders at /reports
           element={
            <ProtectedRoute requiredRole="consultant">
              <ReportDetail />
            </ProtectedRoute>

           }
           />
            <Route
           path="reports/edit/:id" // Renders at /reports
           element={
            <ProtectedRoute requiredRole="consultant">
              <EditReport />
            </ProtectedRoute>

           }
           />
           <Route
           path="tasks/edit/:id" // Renders at /reports
           element={
            <ProtectedRoute requiredRole="consultant">
              <ConsultantEditTask />
            </ProtectedRoute>

           }
           />
           <Route
           path="tasks/create" // Renders at /reports
           element={
            <ProtectedRoute requiredRole="consultant">
              <ConsultantCreateTask />
            </ProtectedRoute>

           }
           />
           <Route
           path="tasks" // Renders at /reports
           element={
            <ProtectedRoute requiredRole="consultant">
              <ConsultantTasksList />
            </ProtectedRoute>

           }
           />
           <Route
           path="tasks/:id" // Renders at /reports
           element={
            <ProtectedRoute requiredRole="consultant">
              <ConsultantTaskDetail />
            </ProtectedRoute>

           }
           />
           {/* --- Consultant Schedules (NEW) --- */}
           <Route
                path="schedules" // Renders at /schedules
                element={
                <ProtectedRoute requiredRole="consultant">
                    <ConsultantSchedulesDashboard />
                </ProtectedRoute>
                }
            />
            <Route
                path="schedules/create" // Renders at /schedules/create
                element={
                <ProtectedRoute requiredRole="consultant">
                    <ConsultantCreateSchedule />
                </ProtectedRoute>
                }
            />
            <Route
                // Using :scheduleId to match component's useParams hook
                path="schedules/:id" // Renders at /schedules/:scheduleId
                element={
                <ProtectedRoute requiredRole="consultant">
                    <ConsultantScheduleDetail />
                </ProtectedRoute>
                }
            />
            <Route
                // Using :scheduleId to match component's useParams hook
                path="schedules/edit/:id" // Renders at /schedules/edit/:scheduleId
                element={
                <ProtectedRoute requiredRole="consultant">
                    <ConsultantEditSchedule />
                </ProtectedRoute>
                }
            />
            {/* --- End Consultant Routes --- */}
           <Route
           path="materials" // Renders at /materials
           element={
            <ProtectedRoute requiredRole="contractor">
              <MaterialsList />
            </ProtectedRoute>

            }
            />

          <Route
           path="materials/create" // Renders at /materials
           element={
            <ProtectedRoute requiredRole="contractor">
              <CreateMaterial />
            </ProtectedRoute>

            }
            />

            <Route
           path="materials/:id" // Renders at /materials
           element={
            <ProtectedRoute requiredRole="contractor">
              <MaterialDetail />
            </ProtectedRoute>

            }
            />

          <Route
           path="materials/edit/:id" // Renders at /materials
           element={
            <ProtectedRoute requiredRole="contractor">
              <EditMaterial />
            </ProtectedRoute>

            }
            />
           
           <Route
           path="contractor-projects" 
           element={
            <ProtectedRoute requiredRole="contractor">
              <ProjectsListForContractor />
            </ProtectedRoute>

            }
            />
            <Route
           path="contractor-projects/:id" 
           element={
            <ProtectedRoute requiredRole="contractor">
              <ProjectDetailForContractor />
            </ProtectedRoute>

            }
            />
            <Route
            path="contractor-reports" 
            element={
            <ProtectedRoute requiredRole="contractor">
              <ReportsListForContractor />
            </ProtectedRoute>

            }
            />
            <Route
            path="contractor-reports/create" 
            element={
            <ProtectedRoute requiredRole="contractor">
              <CreateReportForContractor />
            </ProtectedRoute>

            }
            />
            <Route
            path="contractor-reports/:id" 
            element={
            <ProtectedRoute requiredRole="contractor">
              <ReportDetailForContractor />
            </ProtectedRoute>

            }
            />
            

        
           {/*the end of the contractor routes */}
              
              {/* the project manager routes */}
              <Route
            path="projectmanager-projects" 
            element={
            <ProtectedRoute requiredRole="project_manager">
              <ProjectsListForProjectManager/>
            </ProtectedRoute>

            }
            />

          <Route
            path="projectmanager-projects/:id" 
            element={
            <ProtectedRoute requiredRole="project_manager">
              <ProjectManagerProjectDetail/>
            </ProtectedRoute>

            }
            />
            <Route
            path="projectmanager-reports" 
            element={
            <ProtectedRoute requiredRole="project_manager">
              <ReportListForProjectManager/>
            </ProtectedRoute>

            }
            />


            <Route
            path="projectmanager-reports/:id" 
            element={
            <ProtectedRoute requiredRole="project_manager">
             <ReportDetailForProjectManager/>
            </ProtectedRoute>

            }
            />

          <Route
            path="projectmanager-reports/create" 
            element={
            <ProtectedRoute requiredRole="project_manager">
              <CreateReportForProjectManager/>
            </ProtectedRoute>

            }
            />

           
        </Route>
       
       
        {/* Add more user routes as needed */}
        
        {/* Admin routes with AdminLayout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/users" replace />} />

          {/* User management routes */}
          <Route path="users" element={<UsersList />} />
          <Route path="users/register" element={<UserRegistration />} />

          {/* Project management routes */}
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/create" element={<CreateProject />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="projects/edit/:id" element={<EditProject />} />
          <Route path="projects/debug/:id" element={<ProjectUpdateDebug />} />

          {/* Schedule management routes */}
          <Route path="schedules" element={<SchedulesList />} />
          <Route path="schedules/create" element={<CreateSchedule />} />
          <Route path="schedules/edit/:scheduleId" element={<EditSchedule />} />
          <Route path="schedules/:scheduleId" element={<ScheduleDetail />} />
          {/* // Admin Task Management routes */}
          <Route path="tasks" element={<TasksList />} />
            <Route path="tasks/create" element={<CreateTask />} />
            <Route path="tasks/edit/:id" element={<EditTask />} />
            <Route path="tasks/:id" element={<TaskDetail />} />


             {/* Materials Management */}
             {/* <Route path="materials" element={<MaterialsList />} />
            <Route path="materials/create" element={<CreateMaterial />} />
            <Route path="materials/edit/:id" element={<EditMaterial />} />
            <Route path="materials/:id" element={<MaterialDetail />} /> */}
            {/* Add more Report routes as needed */}
           <Route path="reports" element={<ReportList />} />
           <Route path="reports/:id" element={<ReportDetailAdmin />} />
           <Route path="reports/create" element={<CreateReportForAdmin />} />
           <Route path="analytics" element={<Analytics />} />
          {/* Add more admin routes as needed */}
        </Route>
       

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
