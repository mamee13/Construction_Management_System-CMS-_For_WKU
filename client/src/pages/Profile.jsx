

/*eslint-disable */
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { UserIcon, KeyIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import authAPI from "../api/auth" // Used for initial load
import usersAPI from "../api/users" // Used for updates

const Profile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient() // Can be used to invalidate other queries if needed
  const [activeTab, setActiveTab] = useState("profile")
  const [currentUser, setCurrentUser] = useState(null) // State holding the user data for the UI

  // --- Initial User Load ---
  useEffect(() => {
    console.log("Profile component mounting or navigate dependency changing.");
    const userFromStorage = authAPI.getCurrentUser()
    if (!userFromStorage) {
      toast.error("Session expired or not logged in. Please log in.")
      navigate("/login")
    } else {
      console.log("Setting initial currentUser state from localStorage:", userFromStorage);
      setCurrentUser(userFromStorage)
    }
  }, [navigate]) // Rerun if navigate changes (unlikely but safe)

  // --- Effect to Log State Changes (for debugging UI updates) ---
  useEffect(() => {
    // This runs whenever the 'currentUser' state variable changes AFTER the initial render.
    if (currentUser) { // Avoid logging the initial null state
        console.log("currentUser state has been updated (useEffect observation):", currentUser);
    }
  }, [currentUser]); // Dependency array ensures this runs only when currentUser changes

  // --- Mutations ---
  const profileUpdateMutation = useMutation({
    mutationFn: usersAPI.updateMyProfile, // API function handles backend call AND localStorage update
    onSuccess: (data) => { // 'data' is the object returned by usersAPI.updateMyProfile
      console.log("Profile mutation onSuccess. Received data:", data);
      toast.success(data.message || "Profile updated successfully!");

      // IMPORTANT: Update the component's state with the fresh, complete user data
      // This will trigger a re-render, and Formik (with enableReinitialize) will pick up the changes.
      if (data.success && data.data?.user) {
         const completeUpdatedUser = data.data.user;
         console.log("[onSuccess] Preparing to set currentUser state to:", completeUpdatedUser);
         setCurrentUser(completeUpdatedUser); // Update the state directly
      } else {
         console.error("[onSuccess] Profile update API call succeeded but returned unexpected data format:", data);
         toast.warn("Profile updated, but UI refresh might be incomplete. Please check console.");
         // As a fallback, you could try re-reading from localStorage, but it's better if the API returns the data
         // const userFromStorage = authAPI.getCurrentUser();
         // if (userFromStorage) setCurrentUser(userFromStorage);
      }
    },
    onError: (error) => { // error is the Error object thrown by usersAPI function
      console.error("Profile mutation onError:", error);
      toast.error(error.message || "Failed to update profile. Please try again.");
    },
  })

  const passwordUpdateMutation = useMutation({
    mutationFn: usersAPI.updateMyPassword,
    onSuccess: (data, variables, context) => {
      console.log("Password mutation onSuccess:", data);
      toast.success(data.message || "Password updated successfully!");
      if (context?.resetForm) {
          context.resetForm(); // Reset password form fields
          console.log("Password form reset.");
      }
    },
    onError: (error) => {
       console.error("Password mutation onError:", error);
       toast.error(error.message || "Failed to update password. Check current password.");
    },
  })

  // --- Validation Schemas ---
   const profileValidationSchema = Yup.object({
    firstName: Yup.string().required("First name is required").min(2, "First name must be at least 2 characters"),
    lastName: Yup.string().required("Last name is required").min(2, "Last name must be at least 2 characters"),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    phone: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9]+(-[0-9]+)*$/, "Phone number can only contain digits and hyphens")
      .min(10, "Phone number seems too short")
      .max(15, "Phone number seems too long"),
  })

  const passwordValidationSchema = Yup.object({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .required("New password is required")
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must contain uppercase, lowercase, and number",
      )
       .notOneOf([Yup.ref('currentPassword'), null], "New password must be different"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required"),
  })

  // --- Submit Handlers ---
  const handleProfileUpdate = (values) => {
    console.log("handleProfileUpdate called. Current form values:", values);
    if (!currentUser) {
        toast.error("Cannot update: User data not loaded.");
        return; // Should not happen if loading state is handled
    }
    // Find changed values to send to the backend
    const changedValues = {};
    for (const key in values) {
        if (Object.prototype.hasOwnProperty.call(values, key) && values[key] !== currentUser[key]) {
            changedValues[key] = values[key];
        }
    }

    if (Object.keys(changedValues).length > 0) {
       console.log("Submitting changed profile values:", changedValues);
       profileUpdateMutation.mutate(changedValues) // Trigger the mutation
    } else {
        toast.info("No changes detected in profile information.");
    }
  }

  const handlePasswordUpdate = (values, { resetForm }) => {
     if (!currentUser) {
         toast.error("Cannot update password: User data not loaded.");
         return;
     }
     console.log("Submitting password update for user:", currentUser.email)
     // Send only necessary fields
     const payload = {
         currentPassword: values.currentPassword,
         newPassword: values.newPassword
     };
     // Pass resetForm via context so onSuccess can access it
     passwordUpdateMutation.mutate(payload, { context: { resetForm } });
  }

  // --- Loading State ---
   if (!currentUser) {
    // Display a loading indicator while the initial user data is fetched/set
    return (
        <div className="flex justify-center items-center h-screen">
             <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
             <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
    );
  }

  // --- Render UI ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-gray-500 text-sm">View or update your account details.</p>
      </div>

      {/* Tabs Container */}
       <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        {/* Tabs Navigation */}
         <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
             {/* Profile Tab Button */}
             <button
                type="button"
                className={`${
                    activeTab === "profile"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab("profile")}
                aria-current={activeTab === 'profile' ? 'page' : undefined}
                >
                <UserIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Personal Information
             </button>
             {/* Password Tab Button */}
             <button
                type="button"
                className={`${
                    activeTab === "password"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab("password")}
                aria-current={activeTab === 'password' ? 'page' : undefined}
                >
                <KeyIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Change Password
             </button>
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="px-4 py-5 sm:p-6">
          {/* Conditional Rendering based on activeTab */}
          {activeTab === "profile" ? (
            // --- Profile Form ---
            <Formik
              // IMPORTANT: Key derives directly from currentUser state
              initialValues={{
                firstName: currentUser.firstName || "",
                lastName: currentUser.lastName || "",
                email: currentUser.email || "",
                phone: currentUser.phone || "",
              }}
              validationSchema={profileValidationSchema}
              onSubmit={handleProfileUpdate}
              // enableReinitialize is CRUCIAL for the form to update when `initialValues` (derived from currentUser state) change
              enableReinitialize={true}
              validateOnChange={false}
              validateOnBlur={true}
            >
              {({ errors, touched, initialValues }) => { // Destructure initialValues for logging
                 // Log Formik's state on each render to diagnose updates
                 console.log("Rendering Profile Formik. Current initialValues:", initialValues);
                 return (
                    <Form className="space-y-6">
                        {/* --- Form Fields --- */}
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* First Name */}
                            <div className="sm:col-span-3">
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                                <div className="mt-1">
                                    <Field type="text" name="firstName" id="firstName" autoComplete="given-name" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.firstName && touched.firstName ? "border-red-500" : ""}`} />
                                    <ErrorMessage name="firstName" component="p" className="mt-1 text-sm text-red-600" />
                                </div>
                            </div>
                            {/* Last Name */}
                            <div className="sm:col-span-3">
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                                <div className="mt-1">
                                    <Field type="text" name="lastName" id="lastName" autoComplete="family-name" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.lastName && touched.lastName ? "border-red-500" : ""}`} />
                                    <ErrorMessage name="lastName" component="p" className="mt-1 text-sm text-red-600" />
                                </div>
                            </div>
                        </div>
                        {/* Email */}
                        <div className="sm:col-span-6">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                            <div className="mt-1">
                                <Field type="email" name="email" id="email" autoComplete="email" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.email && touched.email ? "border-red-500" : ""}`} />
                                <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
                            </div>
                        </div>
                        {/* Phone */}
                        <div className="sm:col-span-6">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                            <div className="mt-1">
                                <Field type="tel" name="phone" id="phone" autoComplete="tel" placeholder="e.g., 123-456-7890" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.phone && touched.phone ? "border-red-500" : ""}`} />
                                <ErrorMessage name="phone" component="p" className="mt-1 text-sm text-red-600" />
                            </div>
                        </div>

                        {/* --- Submit Button --- */}
                        <div className="pt-5">
                            <div className="flex justify-end">
                            <button
                                type="submit"
                                // Disable button based *only* on react-query mutation loading state
                                disabled={profileUpdateMutation.isLoading}
                                className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                                ${
                                    profileUpdateMutation.isLoading
                                    ? "bg-indigo-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                }`}
                            >
                                {profileUpdateMutation.isLoading ? (
                                <>
                                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                                    Saving...
                                </>
                                ) : (
                                "Save Changes"
                                )}
                            </button>
                            </div>
                        </div>
                    </Form>
                 );
              }}
            </Formik>
          ) : (
            // --- Password Form ---
            <Formik
              initialValues={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
              validationSchema={passwordValidationSchema}
              onSubmit={handlePasswordUpdate}
              validateOnChange={false}
              validateOnBlur={true}
            >
              {({ errors, touched }) => (
                 <Form className="space-y-6">
                    {/* --- Password Fields --- */}
                    <div className="sm:col-span-6">
                       <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password <span className="text-red-500">*</span></label>
                       <div className="mt-1">
                         <Field type="password" name="currentPassword" id="currentPassword" autoComplete="current-password" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.currentPassword && touched.currentPassword ? "border-red-500" : ""}`} />
                         <ErrorMessage name="currentPassword" component="p" className="mt-1 text-sm text-red-600" />
                       </div>
                    </div>
                    <div className="sm:col-span-6">
                       <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password <span className="text-red-500">*</span></label>
                       <div className="mt-1">
                         <Field type="password" name="newPassword" id="newPassword" autoComplete="new-password" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.newPassword && touched.newPassword ? "border-red-500" : ""}`} />
                         <p className="mt-1 text-xs text-gray-500">Must be 8+ chars, include uppercase, lowercase, and number.</p>
                         <ErrorMessage name="newPassword" component="p" className="mt-1 text-sm text-red-600" />
                       </div>
                    </div>
                    <div className="sm:col-span-6">
                       <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password <span className="text-red-500">*</span></label>
                       <div className="mt-1">
                         <Field type="password" name="confirmPassword" id="confirmPassword" autoComplete="new-password" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.confirmPassword && touched.confirmPassword ? "border-red-500" : ""}`} />
                         <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-sm text-red-600" />
                       </div>
                    </div>

                    {/* --- Submit Button --- */}
                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button
                            type="submit"
                             // Disable button based *only* on react-query mutation loading state
                            disabled={passwordUpdateMutation.isLoading}
                            className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                            ${
                                passwordUpdateMutation.isLoading
                                ? "bg-indigo-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            }`}
                            >
                            {passwordUpdateMutation.isLoading ? (
                                <>
                                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                                Updating...
                                </>
                            ) : (
                                "Change Password"
                            )}
                            </button>
                        </div>
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

export default Profile;