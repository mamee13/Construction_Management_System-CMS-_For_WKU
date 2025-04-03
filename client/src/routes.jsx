

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import authAPI from "./api/auth"

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

// Admin Material Management Pages
import MaterialsList from "./pages/admin/materials/MaterialsList"
import CreateMaterial from "./pages/admin/materials/CreateMaterial"
import EditMaterial from "./pages/admin/materials/EditMaterial"
import MaterialDetail from "./pages/admin/materials/MaterialDetail"
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
// Protected route component
const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = authAPI.isAuthenticated()
  const hasRequiredRole = requiredRole ? authAPI.hasRole(requiredRole) : true

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRequiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
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
           
        
           {/*the end of the consultant routes */}
           
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
             <Route path="materials" element={<MaterialsList />} />
            <Route path="materials/create" element={<CreateMaterial />} />
            <Route path="materials/edit/:id" element={<EditMaterial />} />
            <Route path="materials/:id" element={<MaterialDetail />} />
            {/* Add more Report routes as needed */}
           <Route path="reports" element={<ReportList />} />
           <Route path="reports/:id" element={<ReportDetailAdmin />} />
          {/* Add more admin routes as needed */}
        </Route>
       

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App

