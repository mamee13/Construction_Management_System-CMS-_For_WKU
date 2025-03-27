
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { UserPlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import authAPI from "@/APi/auth"
const UserRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Validation schema using Yup
  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required").min(2, "First name must be at least 2 characters"),
    lastName: Yup.string().required("Last name is required").min(2, "Last name must be at least 2 characters"),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    password: Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    role: Yup.string()
      .required("Role is required")
      .oneOf(["admin", "consultant", "contractor", "project_manager", "committee"], "Invalid role selected"),
    age: Yup.number().required("Age is required").positive("Age must be positive").integer("Age must be an integer"),
    phone: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/, "Phone number must be in the format 123-456-7890"),
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
      // Remove confirmPassword as it's not needed in the API call
      const {  ...userDataToSubmit } = userData
      return authAPI.register(userDataToSubmit)
    },
    onSuccess: () => {
      toast.success("User registered successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      navigate("/admin/users")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register user")
      setIsSubmitting(false)
    },
  })

  // Handle form submission
  const handleSubmit = (values, { resetForm }) => {
    setIsSubmitting(true)
    registerMutation.mutate(values, {
      onSuccess: () => {
        resetForm()
        setIsSubmitting(false)
      },
    })
  }

  // Check if user is admin, redirect if not
  if (!authAPI.isAdmin()) {
    navigate("/dashboard")
    return null
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Register New User</h1>
          <p className="text-gray-500 text-sm">
            Create a new account for administrators, consultants, contractors, project managers, or committee members.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Users
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={true}
          >
            {({ errors, touched }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="firstName"
                        id="firstName"
                        placeholder="John"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.firstName && touched.firstName ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="firstName" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="lastName"
                        id="lastName"
                        placeholder="Doe"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.lastName && touched.lastName ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="lastName" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1">
                    <Field
                      type="email"
                      name="email"
                      id="email"
                      placeholder="user@example.com"
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.email && touched.email ? "border-red-500" : ""
                      }`}
                    />
                    <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="mt-1">
                      <Field
                        type="password"
                        name="password"
                        id="password"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.password && touched.password ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="mt-1">
                      <Field
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.confirmPassword && touched.confirmPassword ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      name="role"
                      id="role"
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.role && touched.role ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Select a role</option>
                      <option value="admin">Administrator</option>
                      <option value="consultant">Consultant</option>
                      <option value="contractor">Contractor</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="committee">Committee Member</option>
                    </Field>
                    <ErrorMessage name="role" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* Age */}
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <div className="mt-1">
                      <Field
                        type="number"
                        name="age"
                        id="age"
                        min="18"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.age && touched.age ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="age" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="phone"
                        id="phone"
                        placeholder="123-456-7890"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.phone && touched.phone ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="phone" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/users")}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                    ${
                      isSubmitting
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        Create User
                      </>
                    )}
                  </button>
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

