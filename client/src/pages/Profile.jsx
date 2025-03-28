"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { UserIcon, KeyIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import authAPI from "../api/auth"

const Profile = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  const currentUser = authAPI.getCurrentUser()

  if (!currentUser) {
    navigate("/login")
    return null
  }

  // Profile update validation schema
  const profileValidationSchema = Yup.object({
    firstName: Yup.string().required("First name is required").min(2, "First name must be at least 2 characters"),
    lastName: Yup.string().required("Last name is required").min(2, "Last name must be at least 2 characters"),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    phone: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/, "Phone number must be in the format 123-456-7890"),
  })

  // Password update validation schema
  const passwordValidationSchema = Yup.object({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .required("New password is required")
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required"),
  })

  // Handle profile update
  const handleProfileUpdate = async (values) => {
    setSubmitting(true)
    try {
      // Log the values being sent
      console.log("Updating profile with:", values)

      // Simulated API call
      // const response = await api.put(`/users/${currentUser._id}`, values);

      // For demo purposes
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Profile updated successfully")

      // Update user in localStorage
      const updatedUser = { ...currentUser, ...values }
      localStorage.setItem("wku_cms_user", JSON.stringify(updatedUser))

      setSubmitting(false)
    } catch (error) {
      console.error("Profile update error:", error)
      toast.error(error.message || "Failed to update profile")
      setSubmitting(false)
    }
  }

  // Handle password update
  const handlePasswordUpdate = async (values, { resetForm }) => {
    setSubmitting(true)
    try {
      // Log the values being sent (excluding the actual password for security)
      console.log("Updating password for user:", currentUser.email)

      // Simulated API call
      // const response = await api.put(`/users/${currentUser._id}/password`, {
      //   currentPassword: values.currentPassword,
      //   newPassword: values.newPassword
      // });

      // For demo purposes
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Password updated successfully")
      resetForm()

      setSubmitting(false)
    } catch (error) {
      console.error("Password update error:", error)
      toast.error(error.message || "Failed to update password")
      setSubmitting(false)
    }
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-gray-500">Manage your account information and change your password.</p>
      </div>

      {/* Profile tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`${
                activeTab === "profile"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab("profile")}
            >
              <UserIcon className="h-5 w-5 inline-block mr-2" />
              Personal Information
            </button>
            <button
              className={`${
                activeTab === "password"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab("password")}
            >
              <KeyIcon className="h-5 w-5 inline-block mr-2" />
              Change Password
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "profile" ? (
            <Formik
              initialValues={{
                firstName: currentUser.firstName || "",
                lastName: currentUser.lastName || "",
                email: currentUser.email || "",
                phone: currentUser.phone || "",
              }}
              validationSchema={profileValidationSchema}
              onSubmit={handleProfileUpdate}
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
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.email && touched.email ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
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

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                      ${
                        submitting
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          ) : (
            <Formik
              initialValues={{
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              }}
              validationSchema={passwordValidationSchema}
              onSubmit={handlePasswordUpdate}
              validateOnChange={false}
              validateOnBlur={true}
            >
              {({ errors, touched }) => (
                <Form className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="mt-1">
                      <Field
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.currentPassword && touched.currentPassword ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="currentPassword" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1">
                      <Field
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.newPassword && touched.newPassword ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="newPassword" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
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

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                      ${
                        submitting
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

