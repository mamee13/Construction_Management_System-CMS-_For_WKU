// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
// import { ToastContainer } from "react-toastify"
// import "react-toastify/dist/ReactToastify.css"
// import authAPI from "./APi/auth"
// // Layouts
// import MainLayout from "./components/layout/MainLayOut"

// import AdminLayout from "./components/layout/AdminLayout"

// // Auth pages
// import LoginForm from "./components/Auth/LoginForm"
// // User pages
// import Dashboard from "./pages/Dashboard"
// import Profile from "./pages/Profile"

// // Admin pages
// import UsersList from "./pages/admin/UsersList"
// import UserRegistration from "./pages/admin/UserRegistration"

// // Protected route component
// const ProtectedRoute = ({ children, requiredRole }) => {
//   const isAuthenticated = authAPI.isAuthenticated()
//   const hasRequiredRole = requiredRole ? authAPI.hasRole(requiredRole) : true

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />
//   }

//   if (requiredRole && !hasRequiredRole) {
//     return <Navigate to="/dashboard" replace />
//   }

//   return children
// }

// function App() {
//   return (
//     <Router>
//       <ToastContainer position="top-right" autoClose={5000} />
//       <Routes>
//         {/* Auth routes */}
//         <Route path="/login" element={<LoginForm />} />

//         {/* User routes with MainLayout */}
//         <Route
//           path="/"
//           element={
//             <ProtectedRoute>
//               <MainLayout />
//             </ProtectedRoute>
//           }
//         >
//           <Route index element={<Navigate to="/dashboard" replace />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="profile" element={<Profile />} />
//           {/* Add more user routes as needed */}
//         </Route>

//         {/* Admin routes with AdminLayout */}
//         <Route
//           path="/admin"
//           element={
//             <ProtectedRoute requiredRole="admin">
//               <AdminLayout />
//             </ProtectedRoute>
//           }
//         >
//           <Route index element={<Navigate to="/admin/users" replace />} />
//           <Route path="users" element={<UsersList />} />
//           <Route path="users/register" element={<UserRegistration />} />
//           {/* Add more admin routes as needed */}
//         </Route>

//         {/* Catch-all route */}
//         <Route path="*" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </Router>
//   )
// }

// export default App

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
        </Route>

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

          {/* Add more admin routes as needed */}
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App

