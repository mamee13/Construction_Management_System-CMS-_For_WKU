import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import authAPI from "./APi/auth";

// Layouts
import MainLayout from "./components/layout/MainLayOut";
import AdminLayout from "./components/layout/AdminLayout";

// Auth pages
import LoginForm from "./components/Auth/LoginForm";
import LoginDebug from "./pages/auth/LoginDebug";

// User pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ChatPage from "./pages/Chat/ChatPage";

// Committee Pages
import CommitteeDashboard from "./pages/Committee/CommitteeDashboard";
import CommitteeProjectsList from "./pages/Committee/projects/ProjectsList";
import CommitteeProjectDetail from "./pages/Committee/projects/ProjectDetail";
import CommitteeReportsList from "./pages/Committee/reports/ReportsList";
import CommitteeReportDetail from "./pages/Committee/reports/ReportDetail";

// Helper Function to Get Dashboard Path
const getDashboardPathByRole = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'consultant':
      return '/projects';
    case 'contractor':
      return '/contractor-projects';
    case 'project_manager':
      return '/projectmanager-projects';
    case 'committee':
      return '/committee-dashboard';
    default:
      return '/dashboard';
  }
};

// Root Redirector Component
const RootRedirector = () => {
  const user = authAPI.getCurrentUser();
  console.log('User role:', user.role);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const dashboardPath = getDashboardPathByRole(user.role);
  console.log(`Redirecting to ${dashboardPath}`);
  return <Navigate to={dashboardPath} replace />;
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = authAPI.isAuthenticated();
  const user = authAPI.getCurrentUser();
  const userRole = user?.role;

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  const hasRequiredRole = requiredRole ? authAPI.hasRole(requiredRole) : true;

  if (requiredRole && !hasRequiredRole) {
    const redirectPath = getDashboardPathByRole(userRole);
    console.log(`Role mismatch. Redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  console.log(`Access granted (Required: ${requiredRole}, User: ${userRole})`);
  return children;
};

// Main App Component
function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/login-debug" element={<LoginDebug />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RootRedirector />
            </ProtectedRoute>
          }
        />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="chat" element={<ChatPage />} />

          <Route path="committee-dashboard" element={<ProtectedRoute requiredRole="committee"><CommitteeDashboard /></ProtectedRoute>} />
          <Route path="committee-projects" element={<ProtectedRoute requiredRole="committee"><CommitteeProjectsList /></ProtectedRoute>} />
          <Route path="committee-projects/:id" element={<ProtectedRoute requiredRole="committee"><CommitteeProjectDetail /></ProtectedRoute>} />
          <Route path="committee-reports" element={<ProtectedRoute requiredRole="committee"><CommitteeReportsList /></ProtectedRoute>} />
          <Route path="committee-reports/:id" element={<ProtectedRoute requiredRole="committee"><CommitteeReportDetail /></ProtectedRoute>} />
        </Route>

        <Route
          path="*"
          element={
            <ProtectedRoute>
              <RootRedirector />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;