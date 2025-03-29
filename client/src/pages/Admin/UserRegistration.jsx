


/*eslint-disable */
import { useState } from "react"
import { useNavigate } from "react-router-dom" // Assuming react-router-dom
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import {
  UserPlusIcon,
  ArrowPathIcon,
  EyeIcon, // Import EyeIcon
  EyeSlashIcon, // Import EyeSlashIcon
} from "@heroicons/react/24/outline"
import authAPI from "@/APi/auth" // Assuming API path is correct

const UserRegistration = () => {
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Validation schema using Yup
  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required").min(2, "Must be at least 2 characters"),
    lastName: Yup.string().required("Last name is required").min(2, "Must be at least 2 characters"),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    password: Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must contain uppercase, lowercase, and number", // Shortened message
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    role: Yup.string()
      .required("Role is required")
      .oneOf(["admin", "consultant", "contractor", "project_manager", "committee"], "Invalid role selected"),
    age: Yup.number()
      .typeError("Age must be a number") // Better type error message
      .required("Age is required")
      .positive("Age must be positive")
      .integer("Age must be an integer")
      .min(18, "User must be at least 18 years old"), // Add min age validation
    phone: Yup.string()
      .required("Phone number is required")
      // Keep the specific format validation if it's a strict requirement
      .matches(/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/, "Format must be 123-456-7890"),
      // Alternative (more flexible):
      // .matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/, 'Invalid phone number format')
  })

  // Initial form values
  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    age: "",
    phone: "",
  }

  // Register mutation using @tanstack/react-query
  const registerMutation = useMutation({
    mutationFn: (userData) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userDataToSubmit } = userData
      console.log("Submitting user data:", userDataToSubmit) // Log data being sent
      return authAPI.register(userDataToSubmit)
    },
    onSuccess: (data, variables, context) => { // Use the main onSuccess
      toast.success(data.message || "User registered successfully!") // Use message from API if available
      queryClient.invalidateQueries({ queryKey: ["users"] }) // Invalidate users list cache
       if (context?.resetForm) {
         context.resetForm(); // Reset form fields on success
       }
      navigate("/admin/users") // Navigate after success
    },
    onError: (error) => {
      console.error("Registration failed:", error)
      toast.error(error.message || "Failed to register user. Please check details.")
      // No need to set submitting state, react-query handles isLoading
    },
  })

  // Handle form submission
  const handleSubmit = (values, { resetForm }) => {
    // Pass resetForm via context so it can be called in onSuccess/onError if needed
     registerMutation.mutate(values, { context: { resetForm } });
  }

  // --- Admin Check ---
  // Ideally, this check should happen via route protection (middleware on backend, route guard on frontend)
  // Leaving it here for now based on original code.
  // if (!authAPI.isAdmin()) {
  //   // Consider showing a "Forbidden" message instead of silent redirect
  //   toast.error("Access Denied: Only administrators can register new users.");
  //   navigate("/dashboard");
  //   return null; // Prevent rendering
  // }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto"> {/* Adjusted max-width */}
      {/* Header */}
      <div className="pb-8 border-b border-gray-200 sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Register New User</h1> {/* Adjusted size */}
          <p className="mt-1 text-sm text-gray-500">
            Create an account with appropriate permissions.
          </p>
        </div>
         <button
          type="button"
          onClick={() => navigate(-1)} // Go back to previous page
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back
        </button>
      </div>

      {/* Form Container */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={false} // Validate only on blur/submit
            validateOnBlur={true}
          >
            {({ errors, touched }) => (
              <Form className="space-y-6">
                {/* --- Personal Information Section --- */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* First Name */}
                  <div className="sm:col-span-3">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="firstName"
                        id="firstName"
                        autoComplete="given-name"
                        placeholder="e.g., Jane"
                        className={`block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.firstName && touched.firstName ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="firstName" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="sm:col-span-3">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="lastName"
                        id="lastName"
                        autoComplete="family-name"
                        placeholder="e.g., Doe"
                        className={`block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.lastName && touched.lastName ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="lastName" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>

                   {/* Age */}
                  <div className="sm:col-span-3">
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="number"
                        name="age"
                        id="age"
                        min="18"
                         placeholder="e.g., 30"
                        className={`block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.age && touched.age ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="age" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="tel" // Use tel type
                        name="phone"
                        id="phone"
                        autoComplete="tel"
                        placeholder="123-456-7890"
                        className={`block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.phone && touched.phone ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="phone" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>
                </div>

                {/* --- Account Information Section --- */}
                <div className="space-y-6 pt-6 border-t border-gray-200">
                   {/* Email */}
                    <div className="sm:col-span-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <Field
                        type="email"
                        name="email"
                        id="email"
                        autoComplete="email"
                        placeholder="e.g., jane.doe@company.com"
                        className={`block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.email && touched.email ? "border-red-500" : ""
                        }`}
                        />
                        <ErrorMessage name="email" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                    </div>

                    {/* Password */}
                    <div className="sm:col-span-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <Field
                            type={showPassword ? "text" : "password"}
                            name="password"
                            id="password"
                            autoComplete="new-password"
                            className={`block w-full pr-10 sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${
                                errors.password && touched.password ? "border-red-500" : ""
                            }`}
                            />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                             >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                        {/* Password help text */}
                        <p className="mt-1 text-xs text-gray-500">
                            Must be 8+ characters, including uppercase, lowercase, and a number.
                        </p>
                        <ErrorMessage name="password" component="p" className="mt-1 text-xs text-red-600" />
                    </div>

                    {/* Confirm Password */}
                    <div className="sm:col-span-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm Password <span className="text-red-500">*</span>
                        </label>
                         <div className="mt-1 relative rounded-md shadow-sm">
                           <Field
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            id="confirmPassword"
                            autoComplete="new-password"
                            className={`block w-full pr-10 sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${
                                errors.confirmPassword && touched.confirmPassword ? "border-red-500" : ""
                            }`}
                           />
                           <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                             >
                                {showConfirmPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                        <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-xs text-red-600" />
                    </div>

                    {/* Role */}
                    <div className="sm:col-span-6">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Assign Role <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                            <Field
                            as="select"
                            name="role"
                            id="role"
                            autoComplete="organization-title"
                            className={`block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${
                                errors.role && touched.role ? "border-red-500" : ""
                            }`}
                            >
                            <option value="" disabled>-- Select a Role --</option>
                            <option value="admin">Administrator</option>
                            <option value="consultant">Consultant</option>
                            <option value="contractor">Contractor</option>
                            <option value="project_manager">Project Manager</option>
                            <option value="committee">Committee Member</option>
                            </Field>
                            <ErrorMessage name="role" component="p" className="mt-1 text-xs text-red-600" />
                        </div>
                    </div>
                </div>

                {/* --- Form Actions --- */}
                <div className="pt-5 border-t border-gray-200">
                  <div className="flex justify-end space-x-3"> {/* Added space-x */}
                    <button
                      type="button"
                      onClick={() => navigate(-1)} // Go back
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registerMutation.isLoading} // Use react-query loading state
                      className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                      ${
                        registerMutation.isLoading
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      }`}
                    >
                      {registerMutation.isLoading ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                          Create User
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  )
}

export default UserRegistration