
/* eslint-disable */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CubeIcon, // Keep if used elsewhere, maybe remove
  InformationCircleIcon, // Added for hint messages
} from "@heroicons/react/24/outline";
import materialsAPI from "../../../api/materials";
import projectsAPI from "../../../api/projects";
import usersAPI from "../../../api/users";
import authAPI from "../../../api/auth";

// --- Constants ---
// Project statuses that should NOT appear in the dropdown for selection
const EXCLUDED_PROJECT_STATUSES = ['completed', 'on_hold', 'cancelled'];

// --- Helper Component to Access Formik Values for Query ---
// No changes needed in this helper component
const ProjectBudgetQuery = ({ showBudgetWarning }) => {
  const { values } = useFormikContext();
  const selectedProjectId = values.project;

  const {
    data: selectedProjectData,
    isLoading: isLoadingSelectedProject,
    error: selectedProjectError,
    isSuccess: isSelectedProjectSuccess,
  } = useQuery({
    queryKey: ["project-details", selectedProjectId], // Use a more specific key
    queryFn: () => projectsAPI.getProjectById(selectedProjectId),
    enabled: !!selectedProjectId, // Only run if a project is selected
    select: (apiResult) => apiResult?.data, // Select the nested data object
    staleTime: 5 * 60 * 1000, // Cache project details for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch just because window focus changes
  });

  useEffect(() => {
    // Pass budget info (or null if loading/error/missing) up to the parent
    if (isSelectedProjectSuccess && selectedProjectData) {
      // Assume 'projectBudget' holds the numeric budget for the project.
      showBudgetWarning(selectedProjectData.projectBudget);
    } else {
      // Reset warning if project changes, is loading, or has error
      showBudgetWarning(null);
    }
  }, [isSelectedProjectSuccess, selectedProjectData, showBudgetWarning, isLoadingSelectedProject, selectedProjectId]); // Added selectedProjectId dependency

  return (
    <>
      {/* Display loading/error specific to fetching budget details */}
      {selectedProjectId && isLoadingSelectedProject && (
        <p className="mt-1 text-xs text-gray-500 flex items-center">
           <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin"/> Loading project budget details...
        </p>
      )}
      {selectedProjectId && selectedProjectError && (
        <p className="mt-1 text-xs text-red-600">
          <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
          Error loading project budget: {selectedProjectError?.message || 'Unknown error'}
        </p>
      )}
    </>
  );
};


const CreateMaterial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [budgetWarning, setBudgetWarning] = useState(null); // Holds { limit: number, totalBudget: number } or null
  const [currentUser, setCurrentUser] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const projectIdFromQuery = queryParams.get("projectId"); // Check if navigating with a pre-selected project

  // Set user state and check authentication and roles
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);

    if (!authAPI.isAuthenticated()) {
      toast.info("Please log in to add materials.");
      navigate("/login", { replace: true });
      return;
    }

    const role = user?.role;
    // Allow only contractors and admins to access this page
    if (role !== "contractor" && role !== "admin") {
      toast.error("Access Denied: You do not have permission to add materials.");
      navigate("/dashboard", { replace: true }); // Redirect to a general dashboard
    }
  }, [navigate]);

  // Fetch projects (assigned for contractor, all for admin) AND FILTER THEM
  const {
    data: projects, // Renamed to 'projects' as it holds the filtered list
    isLoading: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useQuery({
    // Changed queryKey to reflect filtering
    queryKey: ["filtered-projects-for-material", currentUser?.role],
    queryFn: () => {
      if (!currentUser) return Promise.resolve(null); // Don't fetch if user isn't loaded
      if (currentUser.role === "contractor") {
        return projectsAPI.getMyAssignedProjects(); // Fetch projects assigned to the contractor
      }
      return projectsAPI.getAllProjects(); // Fetch all projects for admin
    },
    enabled: !!currentUser && (currentUser.role === 'admin' || currentUser.role === 'contractor'), // Enable only for valid roles
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    select: (apiResult) => {
      // Process and filter the projects
      const rawProjects = apiResult?.data?.projects ?? apiResult?.data ?? [];
      if (!Array.isArray(rawProjects)) {
        console.error("Invalid project data structure received:", apiResult);
        return []; // Return empty array on unexpected structure
      }

      const activeProjects = rawProjects
        .map(p => ({
            ...p,
            // Ensure status is lowercase for consistent comparison
            status: p.status?.toLowerCase(),
        }))
        // Filter out projects with excluded statuses
        .filter(p => p.status && !EXCLUDED_PROJECT_STATUSES.includes(p.status));

      return activeProjects; // Return the filtered list
    },
  });
  // No need for separate projectsArray processing, 'projects' from useQuery is the filtered list


  // Fetch users for dropdown if admin
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isUsersError, // Added for better error handling
    error: usersError,
  } = useQuery({
    queryKey: ["users-for-material-assignment"], // More specific key
    queryFn: usersAPI.getAllUsers,
    enabled: !!currentUser && currentUser.role === "admin", // Only fetch if admin
    staleTime: 15 * 60 * 1000, // Cache user list for 15 minutes
    select: (apiResult) => {
        // Select and filter relevant users
        const allUsers = apiResult?.data?.users ?? apiResult?.data ?? [];
        if (!Array.isArray(allUsers)) return [];
        // Filter for roles that can be assigned materials (adjust as needed)
        return allUsers.filter(u => u && u._id && u.role && ["admin", "project_manager", "contractor"].includes(u.role));
    }
  });

  // Use the data directly from the query for the user dropdown
  const assignableUsers = usersData || [];


  // --- File Handling (No changes needed) ---
  const [selectedFiles, setSelectedFiles] = useState([]);
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 files.");
      return;
    }
    const newFiles = files.filter(
      (file) =>
        !selectedFiles.some(
          (sf) => sf.name === file.name && sf.size === file.size
        )
    );
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    event.target.value = null;
  };
  const handleRemoveFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  // --- End File Handling ---

  // --- Validation Schema ---
  const validationSchema = Yup.object({
    materialName: Yup.string().required("Material name is required").max(100, "Max 100 chars"),
    materialType: Yup.string().required("Material type is required").max(50, "Max 50 chars"),
    quantity: Yup.number()
      .required("Quantity is required")
      .min(0, "Quantity must be non-negative")
      .typeError("Quantity must be a valid number"),
    unit: Yup.string().required("Unit is required").max(20, "Max 20 chars"),
    costPerUnit: Yup.number()
      .required("Cost per unit is required")
      .min(0, "Cost must be non-negative")
      .typeError("Cost must be a valid number"),
    supplier: Yup.string().required("Supplier is required").max(100, "Max 100 chars"),
    // Project is required, validation uses the filtered projects list implicitly
    project: Yup.string().required("Project selection is required"),
    // User selection is required only if the current user is an admin
    user: Yup.string().when([], {
      is: () => currentUser?.role === "admin",
      then: (schema) => schema.required("Responsible user selection is required for admins"),
      otherwise: (schema) => schema.optional(), // Not required for contractors
    }),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["ordered", "delivered"], "Initial status must be 'ordered' or 'delivered'"),
  });

  // Set initial user based on role, project based on query param if available
  const initialValues = {
    materialName: "",
    materialType: "",
    quantity: "",
    unit: "",
    costPerUnit: "",
    supplier: "",
    project: projectIdFromQuery || "", // Pre-fill if projectId is in URL
    // Set user to current user if contractor, leave empty if admin (admin must select)
    user: currentUser?.role === "contractor" ? currentUser?._id : "",
    status: "ordered", // Default status
  };

  // --- Budget Warning Logic ---
  // Receives projectBudget from ProjectBudgetQuery component
  const handleBudgetCheck = (projectBudget) => {
    // Reset warning first
    setBudgetWarning(null);
    // Check if projectBudget is a valid number
    if ( projectBudget === null || projectBudget === undefined || isNaN(Number(projectBudget))) {
      console.warn("Project budget is missing or invalid:", projectBudget);
      // Optionally show a general warning that budget couldn't be verified
      // toast.info("Could not verify project budget information.", { autoClose: 2000 });
      return; // Exit if no valid budget
    }
    const numericBudget = Number(projectBudget);
    const budgetLimit = numericBudget * 0.75; // Calculate 75% threshold
    // Store the limit and total budget for display and validation
    setBudgetWarning({
      limit: budgetLimit,
      totalBudget: numericBudget,
    });
  };

  // --- Create Material Mutation ---
  const createMaterialMutation = useMutation({
    // Assumes createMaterial handles FormData internally if files are included
    mutationFn: (materialData) => materialsAPI.createMaterial(materialData),
    onSuccess: (data) => {
      const createdMaterial = data?.data?.material; // Adjust based on actual API response structure
      toast.success(`Material "${createdMaterial?.materialName || 'New Material'}" added successfully`);
      const projectId = createdMaterial?.project; // Get project ID from response

      // Invalidate relevant queries to refresh data
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["materials", projectId] }); // Materials specific to this project
        queryClient.invalidateQueries({ queryKey: ["project-details", projectId] }); // Project details (like budget)
      }
      queryClient.invalidateQueries({ queryKey: ["materials"] }); // General materials list
      queryClient.invalidateQueries({ queryKey: ["filtered-projects-for-material", currentUser?.role] }); // The project list itself
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // Any other general project queries

      // Navigate based on user role
      if (currentUser?.role === "admin") {
        navigate("/admin/materials");
      } else {
        navigate("/contractor/materials");
      }
    },
    onError: (error) => {
      console.error("Create Material Error:", error);
      const message =
        error?.response?.data?.message || // Backend error message
        error?.message || // General error message
        "Failed to add material due to an unexpected error.";
      toast.error(message);
    },
  });

  // --- Handle Form Submission ---
  const handleSubmit = async (values, { setSubmitting }) => {
    // Double check user context
    if (!currentUser?._id) {
      toast.error("User information is missing. Please refresh and try again.");
      setSubmitting(false);
      return;
    }

    const quantity = Number(values.quantity);
    const costPerUnit = Number(values.costPerUnit);
    // Ensure calculation only happens with valid numbers
    const newMaterialTotalCost =
      !isNaN(quantity) && !isNaN(costPerUnit) && quantity >= 0 && costPerUnit >= 0
        ? quantity * costPerUnit
        : 0;

    const selectedProjectId = values.project;
    if (!selectedProjectId) {
      toast.error("Please select a project before submitting.");
      setSubmitting(false);
      return;
    }

    // --- Rigorous Budget Check on Submit ---
    // This fetches fresh data if needed, bypassing potential stale cache issues from the display-only query.
    let projectBudget;
    let budgetCheckError = null;
    try {
      // Attempt to get fresh data directly
      console.log(`Submit Budget Check: Fetching project ${selectedProjectId}...`);
      const apiResult = await queryClient.fetchQuery({
          queryKey: ["project-details", selectedProjectId],
          queryFn: () => projectsAPI.getProjectById(selectedProjectId),
          staleTime: 0 // Force fetch by setting staleTime to 0 for this specific call
      });
      projectBudget = apiResult?.data?.projectBudget;

      if (projectBudget === undefined || projectBudget === null || isNaN(Number(projectBudget))) {
        console.warn("Submit Budget Check: Budget info missing/invalid in fetched data:", apiResult?.data);
        // Decide policy: block submission or allow with warning? Let's allow with warning.
        toast.warn("Could not verify project budget during submission. Proceeding with caution.");
      } else {
        const numericBudget = Number(projectBudget);
        const budgetThreshold = numericBudget * 0.75;
        console.log(
          `Submit Budget Check: Material Cost ($${newMaterialTotalCost.toFixed(2)}) vs Budget ($${numericBudget.toFixed(
            2
          )}). Threshold: $${budgetThreshold.toFixed(2)}`
        );

        // *** Strict Check: Block if over threshold ***
        if (newMaterialTotalCost > budgetThreshold) {
          toast.error(
            `Submission Blocked: Material cost ($${newMaterialTotalCost.toFixed(
              2
            )}) exceeds 75% budget threshold ($${budgetThreshold.toFixed(2)}). Project Budget: $${numericBudget.toFixed(2)}.`,
            { autoClose: 10000 }
          );
          setSubmitting(false);
          return; // Stop the submission process
        }
      }
    } catch (error) {
        budgetCheckError = error; // Catch fetch errors
        console.error("Submit Budget Check: Error fetching project details:", error);
        toast.error(`Critical Error: Could not verify project budget due to fetch error: ${error.message}. Submission halted.`);
        setSubmitting(false);
        return; // Stop submission if budget check fails critically
    }
    // --- End Budget Check ---


    // Prepare data payload for the API
    const materialData = {
      ...values, // Spread validated form values
      quantity: quantity,
      costPerUnit: costPerUnit,
      totalCost: newMaterialTotalCost,
      // Ensure 'user' is the selected user if admin, or current user if contractor
      user: currentUser.role === "admin" ? values.user : currentUser._id,
      // Include files if needed by the API - assumes createMaterial handles FormData
      // attachments: selectedFiles,
    };

    // Log the data being sent (remove sensitive info in production)
    console.log("Submitting Material Data:", materialData);

    // Execute the mutation
    createMaterialMutation.mutate(materialData, {
      // onSettled is called after onSuccess or onError
      onSettled: () => {
        setSubmitting(false); // Ensure submitting state is reset
      },
    });
  };

  // --- Conditional Disable Logic for Submit Button ---
  // Function to check if the current values exceed the budget warning limit
  const checkCostExceedsLimit = (values, warning) => {
    if (!warning) return false; // No warning, no problem
    const quantity = Number(values.quantity);
    const costPerUnit = Number(values.costPerUnit);
    const totalCost =
      !isNaN(quantity) && !isNaN(costPerUnit) && quantity >= 0 && costPerUnit >= 0
        ? quantity * costPerUnit
        : 0;
    return totalCost > warning.limit;
  };


  // Render loading state if user data isn't available yet
  if (!currentUser) {
    return <div className="p-10 text-center">Loading user data...</div>;
  }
  // Render access denied if role is incorrect (though useEffect should redirect)
  if (currentUser.role !== "admin" && currentUser.role !== "contractor") {
    return <div className="p-10 text-center">Access Denied.</div>;
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)} // Go back to the previous page
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1.5 text-gray-500" />
          Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 text-center flex-grow">
          Add New Material
        </h1>
        <div className="w-16"></div> {/* Spacer */}
      </div>
      <p className="text-gray-600 text-sm text-center mb-8">
        Fill in the details for the new material. Fields marked with <span className="text-red-500">*</span> are required.
      </p>

      {/* Form Container */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={true} // Validate on change for immediate feedback
            validateOnBlur={true}   // Validate on blur
            enableReinitialize={true} // Allows form to reset if initialValues change (e.g., user loads)
          >
            {({ errors, touched, values, dirty, isValid, isSubmitting: formikIsSubmitting }) => {
              // Determine if the submit button should be disabled
              const costExceedsLimit = checkCostExceedsLimit(values, budgetWarning);
              const disableSubmit = formikIsSubmitting || !dirty || !isValid || costExceedsLimit || isLoadingProjects;

              return (
                <Form className="space-y-6">
                  {/* Component to fetch and display budget info */}
                  <ProjectBudgetQuery showBudgetWarning={handleBudgetCheck} />

                  {/* Display Budget Warning Banner */}
                  {budgetWarning && values.project && (
                    <div
                      className={`p-3 rounded-md border ${
                        costExceedsLimit
                          ? "bg-red-50 border-red-300" // Error style if cost exceeds limit
                          : "bg-yellow-50 border-yellow-300" // Warning style otherwise
                      }`}
                    >
                      <div className="flex items-start">
                        <ExclamationTriangleIcon
                          className={`h-5 w-5 flex-shrink-0 ${
                            costExceedsLimit ? "text-red-500" : "text-yellow-500"
                          }`}
                          aria-hidden="true"
                        />
                        <div className="ml-3 flex-1">
                          <h3
                            className={`text-sm font-medium ${
                              costExceedsLimit ? "text-red-800" : "text-yellow-800"
                            }`}
                          >
                            {costExceedsLimit ? "Budget Threshold Exceeded" : "Budget Alert"}
                          </h3>
                          <div
                            className={`mt-1 text-xs ${
                              costExceedsLimit ? "text-red-700" : "text-yellow-700"
                            }`}
                          >
                            Project Budget: {materialsAPI.formatCurrency(budgetWarning.totalBudget)}.
                            <br />
                            75% Threshold: {materialsAPI.formatCurrency(budgetWarning.limit)}.
                            <br />
                            Current Material Est. Cost: {materialsAPI.formatCurrency(
                              (Number(values.quantity) * Number(values.costPerUnit)) || 0
                            )}
                            {costExceedsLimit && (
                                <p className="font-semibold mt-1">Submission will be blocked.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Material Name */}
                  <div>
                    <label htmlFor="materialName" className="block text-sm font-medium text-gray-700 mb-1">
                      Material Name <span className="text-red-500">*</span>
                    </label>
                     <Field
                        type="text"
                        name="materialName"
                        id="materialName"
                        placeholder="e.g., Portland Cement Type I"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.materialName && touched.materialName ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        aria-invalid={!!(errors.materialName && touched.materialName)}
                        aria-describedby="materialName-error"
                      />
                      <ErrorMessage name="materialName" id="materialName-error" component="p" className="mt-1 text-xs text-red-600" />
                  </div>

                  {/* Grid: Material Type / Supplier */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="materialType" className="block text-sm font-medium text-gray-700 mb-1">
                        Material Type <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        name="materialType"
                        id="materialType"
                        placeholder="e.g., Binder, Aggregate, Fastener"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.materialType && touched.materialType ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        aria-invalid={!!(errors.materialType && touched.materialType)}
                        aria-describedby="materialType-error"
                      />
                      <ErrorMessage name="materialType" id="materialType-error" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                    <div>
                      <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        name="supplier"
                        id="supplier"
                        placeholder="e.g., Construction Supply Co."
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.supplier && touched.supplier ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        aria-invalid={!!(errors.supplier && touched.supplier)}
                        aria-describedby="supplier-error"
                      />
                      <ErrorMessage name="supplier" id="supplier-error" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>

                  {/* Grid: Quantity / Unit / Cost Per Unit / Total Cost */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-4">
                     {/* Quantity */}
                    <div className="sm:col-span-1">
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="number"
                        name="quantity"
                        id="quantity"
                        min="0"
                        step="any" // Allow decimals
                        placeholder="e.g., 500"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.quantity && touched.quantity ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        aria-invalid={!!(errors.quantity && touched.quantity)}
                        aria-describedby="quantity-error"
                      />
                      <ErrorMessage name="quantity" id="quantity-error" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                     {/* Unit */}
                    <div className="sm:col-span-1">
                      <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        name="unit"
                        id="unit"
                        placeholder="e.g., kg, bags, m³, pcs"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.unit && touched.unit ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                         aria-invalid={!!(errors.unit && touched.unit)}
                         aria-describedby="unit-error"
                      />
                      <ErrorMessage name="unit" id="unit-error" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                     {/* Cost Per Unit */}
                    <div className="sm:col-span-1">
                      <label htmlFor="costPerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                        Cost/Unit <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <Field
                          type="number"
                          name="costPerUnit"
                          id="costPerUnit"
                          min="0"
                          step="0.01" // Allow cents
                          placeholder="e.g., 5.50"
                          className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-3 py-2 sm:text-sm border-gray-300 rounded-md ${
                            errors.costPerUnit && touched.costPerUnit ? "border-red-500 ring-1 ring-red-500" : ""
                          }`}
                           aria-invalid={!!(errors.costPerUnit && touched.costPerUnit)}
                           aria-describedby="costPerUnit-error"
                        />
                      </div>
                      <ErrorMessage name="costPerUnit" id="costPerUnit-error" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                     {/* Total Cost (Display Only) */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Total Cost</label>
                       <div className="block w-full py-2 px-3 sm:text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                        {materialsAPI.formatCurrency(
                          (Number(values.quantity) * Number(values.costPerUnit)) || 0
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Selection */}
                  <div>
                    <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                      Project <span className="text-red-500">*</span>
                    </label>
                     <Field
                        as="select"
                        name="project"
                        id="project"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.project && touched.project ? "border-red-500 ring-1 ring-red-500" : ""
                        } ${projectIdFromQuery ? "bg-gray-100 cursor-not-allowed" : ""} ${isLoadingProjects ? "bg-gray-100 cursor-wait" : ""}`}
                        // Disable if loading OR if a project ID was passed via query param
                        disabled={isLoadingProjects || !!projectIdFromQuery}
                        aria-invalid={!!(errors.project && touched.project)}
                        aria-describedby="project-error project-loading-error project-empty"
                      >
                        <option value="" disabled={isLoadingProjects || (!isLoadingProjects && (!projects || projects.length === 0))}>
                          {isLoadingProjects
                            ? "Loading active projects..."
                            : (!projects || projects.length === 0)
                            ? "No active projects found"
                            : "-- Select an active project --"}
                        </option>
                        {/* Iterate over the FILTERED projects list */}
                        {(projects ?? []).map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.projectName}
                          </option>
                        ))}
                      </Field>
                      {/* Loading/Error/Empty states for projects */}
                      {isLoadingProjects && (
                        <p id="project-loading-error" className="mt-1 text-xs text-gray-500">Loading available projects...</p>
                      )}
                      {isProjectsError && (
                        <p id="project-loading-error" className="mt-1 text-xs text-red-600">
                          Error loading projects: {projectsError?.message || 'Unknown error'}
                        </p>
                      )}
                      {!isLoadingProjects && !isProjectsError && (!projects || projects.length === 0) && (
                        <p id="project-empty" className="mt-1 text-xs text-yellow-700 flex items-center">
                           <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> No projects available or assigned (must be active).
                        </p>
                      )}
                      {/* Validation Error */}
                      <ErrorMessage name="project" id="project-error" component="p" className="mt-1 text-xs text-red-600" />
                  </div>

                  {/* Grid: User (Conditional) / Status */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    {/* Responsible User (Admin Only) */}
                    {currentUser?.role === "admin" ? (
                      <div>
                        <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                          Responsible User <span className="text-red-500">*</span>
                        </label>
                        <Field
                          as="select"
                          name="user"
                          id="user"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.user && touched.user ? "border-red-500 ring-1 ring-red-500" : ""
                          } ${isLoadingUsers ? "bg-gray-100 cursor-wait" : ""}`}
                          disabled={isLoadingUsers}
                          aria-invalid={!!(errors.user && touched.user)}
                          aria-describedby="user-error user-loading-error user-empty"
                        >
                          <option value="" disabled={isLoadingUsers || (!isLoadingUsers && assignableUsers.length === 0)}>
                            {isLoadingUsers ? "Loading users..." : assignableUsers.length === 0 ? "No assignable users found" : "-- Select a user --"}
                          </option>
                          {/* Iterate over assignableUsers (already filtered) */}
                          {assignableUsers.map((u) => (
                            <option key={u._id} value={u._id}>
                              {`${u.firstName ?? ""} ${u.lastName ?? ""} (${u.role
                                ? u.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                                : "N/A"})`}
                            </option>
                          ))}
                        </Field>
                         {/* Loading/Error/Empty states for users */}
                        {isLoadingUsers && (
                            <p id="user-loading-error" className="mt-1 text-xs text-gray-500">Loading users...</p>
                        )}
                        {isUsersError && (
                            <p id="user-loading-error" className="mt-1 text-xs text-red-600">
                              Error loading users: {usersError?.message || 'Unknown error'}
                            </p>
                        )}
                        {!isLoadingUsers && !isUsersError && assignableUsers.length === 0 && (
                           <p id="user-empty" className="mt-1 text-xs text-gray-500">No users available for assignment.</p>
                        )}
                        {/* Validation Error */}
                        <ErrorMessage name="user" id="user-error" component="p" className="mt-1 text-xs text-red-600" />
                      </div>
                    ) : (
                      // Display current user info for Contractors
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Added By</label>
                        <p className="block w-full py-2 px-3 sm:text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-700">
                          {currentUser?.firstName} {currentUser?.lastName} (You)
                        </p>
                         {/* Hidden field to pass contractor's ID */}
                         <Field type="hidden" name="user" value={currentUser?._id} />
                      </div>
                    )}

                    {/* Initial Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Initial Status <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="status"
                        id="status"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.status && touched.status ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        aria-invalid={!!(errors.status && touched.status)}
                        aria-describedby="status-error"
                      >
                        <option value="ordered">Ordered</option>
                        <option value="delivered">Delivered</option>
                      </Field>
                      <ErrorMessage name="status" id="status-error" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>

                  {/* Submit Button Area */}
                  <div className="pt-5">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        // Navigate back based on role
                        onClick={() => navigate(currentUser?.role === "admin" ? "/admin/materials" : "/contractor/materials")}
                        disabled={formikIsSubmitting} // Disable cancel while submitting
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={disableSubmit} // Use the calculated disable state
                        className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                          disableSubmit
                            ? "bg-indigo-300 cursor-not-allowed" // Disabled style
                            : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" // Enabled style
                        } disabled:opacity-70`} // General disabled opacity
                      >
                        {formikIsSubmitting ? (
                          <>
                            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" /> Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" /> Add Material
                          </>
                        )}
                      </button>
                    </div>
                     {/* Show reason for disabling if cost exceeds limit */}
                     {costExceedsLimit && !formikIsSubmitting && (
                         <p className="text-xs text-red-600 text-right mt-2">
                             Cannot submit: Estimated cost exceeds 75% budget threshold.
                         </p>
                     )}
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CreateMaterial;