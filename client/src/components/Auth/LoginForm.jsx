// src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import authAPI from '@/APi/auth'; // Ensure this path is correct

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (credentials) => authAPI.login(credentials), // This function must handle storing token/user data
    onSuccess: (data) => {
      // Ensure login was truly successful according to your API response structure
      if (data.success) { // Adjust condition based on your actual API response
        console.log("Login successful via API."); // Debug log

        // --- FIX: Navigate to the root path ---
        // Let App.js's RootRedirector handle the role-based redirection.
        // This assumes authAPI.login() has ALREADY updated the authentication state
        // (e.g., stored token, user data) so that ProtectedRoute/RootRedirector work correctly.
        navigate('/');
        // --- End of Fix ---

      } else {
        // Handle cases where API returns success: false or lacks expected data
        console.error("Login API reported success false or missing data:", data);
        setError(data.message || 'Login failed: Invalid response from server.');
      }
    },
    onError: (error) => {
      console.error("Login mutation error:", error); // Debug log
      // Provide more specific error messages if possible
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      if (error.response?.data?.message) { // Example: If using axios and server sends specific message
          errorMessage = error.response.data.message;
      } else if (error.message) {
          errorMessage = error.message;
      }
      setError(errorMessage);
    }
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    console.log("Submitting login form:", formData.email); // Debug log
    loginMutation.mutate(formData);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to WKU Construction Management System
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                aria-describedby={error ? "error-message" : undefined} // Accessibility improvement
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Password
              </label>
              {/* Add Forgot Password link if applicable */}
              {/* <div className="text-sm">
                <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div> */}
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                aria-describedby={error ? "error-message" : undefined} // Accessibility improvement
              />
            </div>
          </div>

          {/* Error message association for screen readers */}
          {error && <p id="error-message" className="sr-only">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                 <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Optional: Add link for registration if needed */}
        {/* <p className="mt-10 text-center text-sm text-gray-500">
          Not a member?{' '}
          <a href="/register" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Register here
          </a>
        </p> */}
      </div>
    </div>
  );
};

export default LoginForm;