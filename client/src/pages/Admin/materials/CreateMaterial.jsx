
/*eslint-disable */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik"; // Import useFormikContext
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon, // For budget error display
} from "@heroicons/react/24/outline";
import materialsAPI from "../../../api/materials";
import projectsAPI from "../../../api/projects";
import usersAPI from "../../../api/users";
import authAPI from "../../../api/auth";

// --- Helper Component to Access Formik Values for Query ---
// This component allows the project detail query to depend on the selected project ID from Formik
const ProjectBudgetQuery = ({ showBudgetWarning }) => {
  const { values } = useFormikContext();
  const selectedProjectId = values.project;

  // Fetch selected project details (ONLY runs when selectedProjectId has a value)
  const {
    data: selectedProjectData,
    isLoading: isLoadingSelectedProject,
    error: selectedProjectError,
    isSuccess: isSelectedProjectSuccess,
  } = useQuery({
    queryKey: ["projects", selectedProjectId], // Query key includes the ID
    queryFn: () => projectsAPI.getProjectById(selectedProjectId),
    enabled: !!selectedProjectId, // Only run query if a project ID is selected
    select: (response) => response?.data, // Extract data object
    staleTime: 5 * 60 * 1000, // Cache project details for 5 minutes
  });

  // Pass the budget warning check function the necessary data
  useEffect(() => {
     if (isSelectedProjectSuccess && selectedProjectData) {
        showBudgetWarning(selectedProjectData.projectBudget);
     } else {
        showBudgetWarning(null); // Reset warning if project changes or fails
     }
  }, [isSelectedProjectSuccess, selectedProjectData, showBudgetWarning]);


  return (
    <>
      {/* Optional: Display Loading/Error state for project details near the project dropdown */}
      {selectedProjectId && isLoadingSelectedProject && (
        <p className="mt-1 text-xs text-gray-500">Loading project budget...</p>
      )}
      {selectedProjectId && selectedProjectError && (
        <p className="mt-1 text-xs text-red-600">
          Error loading project details: {selectedProjectError.message}
        </p>
      )}
    </>
  );
};
// --- End Helper Component ---


const CreateMaterial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  // const [isSubmitting, setIsSubmitting] = useState(false); // Use Formik's isSubmitting
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [budgetWarning, setBudgetWarning] = useState(null); // To display budget info/warnings

  const queryParams = new URLSearchParams(location.search);
  const projectIdFromQuery = queryParams.get("projectId");

  useEffect(() => {
    const adminStatus = authAPI.isAdmin();
    const user = authAPI.getCurrentUser();
    setIsAdmin(adminStatus);
    setCurrentUser(user);

    if (!adminStatus) {
      toast.error("Access Denied: Admin privileges required.");
      navigate("/");
    }
  }, [navigate]);

  // Fetch projects for dropdown
  const {
    data: projectsArray,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsAPI.getAllProjects,
    select: (response) => response?.data ?? [],
  });

  // Fetch users for assignee dropdown
  const {
    data: usersArray,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: usersAPI.getAllUsers,
    select: (response) => response?.data ?? [],
  });

  // --- Create Material Mutation (No change needed here) ---
  const createMaterialMutation = useMutation({
    mutationFn: (materialData) => materialsAPI.createMaterial(materialData),
    onSuccess: (data) => {
        toast.success("Material added successfully");
        // Use optional chaining for safety
        const projectId = data?.data?.project;
        if (projectId) {
            queryClient.invalidateQueries({ queryKey: ["materials", projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects", projectId] }); // Invalidate specific project details too
        }
        queryClient.invalidateQueries({ queryKey: ["materials"] }); // General list
        queryClient.invalidateQueries({ queryKey: ["projects"] }); // General list
        navigate("/admin/materials");
      },
    onError: (error) => {
      console.error("Create Material Error:", error);
      // Check for specific budget error message from backend (if implemented)
      const message = error?.response?.data?.message || error?.message || "Failed to add material.";
      toast.error(message);
      // isSubmitting is handled by Formik automatically
    },
    // onSettled handled by Formik's state
  });

  // --- Validation Schema (No change) ---
  const validationSchema = Yup.object({
    materialName: Yup.string().required("Material name is required").max(100, "Max 100 chars"),
    materialType: Yup.string().required("Material type is required").max(50, "Max 50 chars"),
    quantity: Yup.number().required("Quantity is required").min(0, "Must be non-negative").typeError("Must be a number"),
    unit: Yup.string().required("Unit is required").max(20, "Max 20 chars"),
    costPerUnit: Yup.number().required("Cost per unit is required").min(0, "Must be non-negative").typeError("Must be a number"),
    supplier: Yup.string().required("Supplier is required").max(100, "Max 100 chars"),
    project: Yup.string().required("Project is required"), // Project ID
    user: Yup.string().required("Assigned user is required"), // User ID
    status: Yup.string().required("Status is required").oneOf(["ordered", "delivered", "in_use", "depleted"], "Invalid status"),
  });

  // --- Initial Values (No change) ---
  const initialValues = {
    materialName: "",
    materialType: "",
    quantity: "",
    unit: "",
    costPerUnit: "",
    supplier: "",
    project: projectIdFromQuery || "",
    user: currentUser?._id || "",
    status: "ordered",
  };

 // --- Budget Warning Logic ---
  // This function will be called by ProjectBudgetQuery when project data is available
  const handleBudgetCheck = (projectBudget) => {
    setBudgetWarning(null); // Clear previous warning

    if (projectBudget === null || projectBudget === undefined || isNaN(Number(projectBudget))) {
      // console.warn("Project budget data is missing or invalid.");
      return; // Cannot perform check
    }

    // Get current form values (quantity, costPerUnit) - this won't work directly here
    // We need to access these values within handleSubmit or useFormikContext if needed live
    // For now, just store the budget limit
    const budgetLimit = projectBudget * 0.75;
    setBudgetWarning({
        limit: budgetLimit,
        totalBudget: projectBudget
    });
  };


  // --- MODIFIED: Handle form submission ---
  const handleSubmit = async (values, { setSubmitting }) => { // Receive setSubmitting from Formik
    // Calculate total cost safely
    const quantity = Number(values.quantity);
    const costPerUnit = Number(values.costPerUnit);
    const newMaterialTotalCost = !isNaN(quantity) && !isNaN(costPerUnit) ? quantity * costPerUnit : 0;

    // --- Budget Check ---
    const selectedProjectId = values.project;
    if (!selectedProjectId) {
        toast.error("Please select a project.");
        setSubmitting(false);
        return;
    }

    try {
        // Fetch the selected project's details *again* here to ensure freshness before submit
        // Or rely on the cached data if fresh enough (using staleTime in query)
        const projectQueryData = queryClient.getQueryData(["projects", selectedProjectId]);

        // Use cached data if available and not considered stale by React Query
        let projectBudget;
        if (projectQueryData) {
             console.log("Using cached project data for budget check.");
             projectBudget = projectQueryData.projectBudget; // Assuming projectQueryData is the result of 'select'
        } else {
            // If not cached or stale, fetch it directly (blocks submission until fetched)
             console.log("Fetching fresh project data for budget check...");
             const response = await projectsAPI.getProjectById(selectedProjectId);
             if (!response?.success || !response?.data) {
                 throw new Error(response?.message || "Could not verify project budget.");
             }
             projectBudget = response.data.projectBudget;
        }


        if (projectBudget === undefined || projectBudget === null || isNaN(Number(projectBudget))) {
            console.error("Project budget information is missing or invalid.", projectQueryData);
            toast.warn("Could not verify project budget. Proceeding with caution.");
            // Decide whether to block or allow submission if budget is unknown
            // return; // Option: Block if budget unknown
        } else {
            const numericBudget = Number(projectBudget);
            const budgetThreshold = numericBudget * 0.75;

            console.log(`Checking budget: Material Cost ($${newMaterialTotalCost.toFixed(2)}) vs Project Budget Limit ($${budgetThreshold.toFixed(2)} of $${numericBudget.toFixed(2)})`);

            if (newMaterialTotalCost > budgetThreshold) {
                toast.error(
                    `Cost Exceeds Limit! Material cost ($${newMaterialTotalCost.toFixed(2)}) is more than 75% of the project's remaining budget ($${numericBudget.toFixed(2)}). Limit is $${budgetThreshold.toFixed(2)}.`,
                    { autoClose: 7000 } // Keep message longer
                );
                setSubmitting(false); // Stop submission
                return; // Exit handleSubmit
            }
        }

    } catch (error) {
        console.error("Error during budget check:", error);
        toast.error(`Error checking project budget: ${error.message}`);
        setSubmitting(false); // Stop submission on error
        return; // Exit handleSubmit
    }

    // --- Proceed if budget check passes (or is skipped) ---
    const apiData = {
      ...values,
      quantity: quantity,
      costPerUnit: costPerUnit,
      totalCost: newMaterialTotalCost,
    };

    console.log("Submitting API Data:", apiData);
    createMaterialMutation.mutate(apiData, {
        onSettled: () => {
            setSubmitting(false); // Ensure Formik's submitting state is reset
        }
    });
  };


  // Prevent rendering if not admin
  if (!isAdmin) {
    return <div className="p-10 text-center">Checking authorization...</div>;
  }

  // Main component render
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            {/* ... Back button ... */}
            <button
            type="button"
            onClick={() => navigate(-1)} // Go back one step in history
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
            <ArrowLeftIcon className="h-5 w-5 mr-1.5 text-gray-500" />
            Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 text-center flex-grow">Add New Material</h1>
            <div className="w-16"></div> {/* Spacer */}
        </div>
        <p className="text-gray-500 text-sm text-center mb-6">Enter the details for the new material.</p>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit} // Use the modified handleSubmit
            validateOnChange={false}
            validateOnBlur={true}
            enableReinitialize={true}
          >
            {({ errors, touched, values, isSubmitting: formikIsSubmitting }) => (
              <Form className="space-y-6">
                {/* Pass the budget check handler to the helper component */}
                <ProjectBudgetQuery showBudgetWarning={handleBudgetCheck} />

                 {/* Display Budget Warning if present */}
                 {budgetWarning && values.project && (
                    <div className={`p-3 rounded-md border ${ (values.quantity && values.costPerUnit && (Number(values.quantity) * Number(values.costPerUnit)) > budgetWarning.limit) ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
                        <div className="flex items-start">
                            <ExclamationTriangleIcon className={`h-5 w-5 ${ (values.quantity && values.costPerUnit && (Number(values.quantity) * Number(values.costPerUnit)) > budgetWarning.limit) ? 'text-red-500' : 'text-yellow-500'}`} aria-hidden="true" />
                            <div className="ml-3">
                                <h3 className={`text-sm font-medium ${ (values.quantity && values.costPerUnit && (Number(values.quantity) * Number(values.costPerUnit)) > budgetWarning.limit) ? 'text-red-800' : 'text-yellow-800'}`}>
                                    Budget Alert
                                </h3>
                                <div className={`mt-1 text-xs ${ (values.quantity && values.costPerUnit && (Number(values.quantity) * Number(values.costPerUnit)) > budgetWarning.limit) ? 'text-red-700' : 'text-yellow-700'}`}>
                                   Project Budget: ${budgetWarning.totalBudget?.toFixed(2) ?? 'N/A'}.
                                   <br />
                                   Material cost should ideally be below 75% limit (${budgetWarning.limit?.toFixed(2) ?? 'N/A'}).
                                   <br/>
                                   Current Cost: ${ (values.quantity && values.costPerUnit && !isNaN(Number(values.quantity)) && !isNaN(Number(values.costPerUnit))) ? (Number(values.quantity) * Number(values.costPerUnit)).toFixed(2) : '$0.00'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* --- Form Fields (remain largely the same) --- */}

                {/* Material Name */}
                <div>
                  <label htmlFor="materialName" className="block text-sm font-medium text-gray-700">
                    Material Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <Field type="text" name="materialName" id="materialName" placeholder="e.g., Portland Cement Type I"
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ errors.materialName && touched.materialName ? "border-red-500" : "" }`}
                    />
                    <ErrorMessage name="materialName" component="p" className="mt-1 text-xs text-red-600" />
                  </div>
                </div>

                {/* Grid for Type / Supplier */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                   {/* Material Type */}
                    <div>
                        {/* ... label ... */}
                        <label htmlFor="materialType" className="block text-sm font-medium text-gray-700"> Material Type <span className="text-red-500">*</span> </label>
                        <div className="mt-1">
                           {/* ... field ... */}
                           <Field type="text" name="materialType" id="materialType" placeholder="e.g., Binder, Aggregate" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ errors.materialType && touched.materialType ? "border-red-500" : "" }`} />
                           <ErrorMessage name="materialType" component="p" className="mt-1 text-xs text-red-600" />
                        </div>
                    </div>
                     {/* Supplier */}
                    <div>
                       {/* ... label ... */}
                       <label htmlFor="supplier" className="block text-sm font-medium text-gray-700"> Supplier <span className="text-red-500">*</span> </label>
                       <div className="mt-1">
                          {/* ... field ... */}
                           <Field type="text" name="supplier" id="supplier" placeholder="e.g., Construction Supply Co." className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ errors.supplier && touched.supplier ? "border-red-500" : "" }`} />
                           <ErrorMessage name="supplier" component="p" className="mt-1 text-xs text-red-600" />
                       </div>
                    </div>
                </div>

                {/* Grid for Quantity / Unit / Cost / Total */}
                 <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    {/* Quantity */}
                    <div>
                        {/* ... label ... */}
                         <label htmlFor="quantity" className="block text-sm font-medium text-gray-700"> Quantity <span className="text-red-500">*</span> </label>
                        <div className="mt-1">
                           {/* ... field ... */}
                           <Field type="number" name="quantity" id="quantity" min="0" step="any" placeholder="e.g., 500" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ errors.quantity && touched.quantity ? "border-red-500" : "" }`} />
                            <ErrorMessage name="quantity" component="p" className="mt-1 text-xs text-red-600" />
                        </div>
                    </div>
                    {/* Unit */}
                    <div>
                        {/* ... label ... */}
                         <label htmlFor="unit" className="block text-sm font-medium text-gray-700"> Unit <span className="text-red-500">*</span> </label>
                        <div className="mt-1">
                           {/* ... field ... */}
                           <Field type="text" name="unit" id="unit" placeholder="e.g., kg, bags, m³" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ errors.unit && touched.unit ? "border-red-500" : "" }`} />
                            <ErrorMessage name="unit" component="p" className="mt-1 text-xs text-red-600" />
                        </div>
                    </div>
                     {/* Cost Per Unit */}
                    <div>
                       {/* ... label ... */}
                        <label htmlFor="costPerUnit" className="block text-sm font-medium text-gray-700"> Cost Per Unit ($) <span className="text-red-500">*</span> </label>
                       <div className="mt-1 relative rounded-md shadow-sm">
                           {/* ... dollar sign ... */}
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"> <span className="text-gray-500 sm:text-sm">$</span> </div>
                           {/* ... field ... */}
                            <Field type="number" name="costPerUnit" id="costPerUnit" min="0" step="0.01" placeholder="e.g., 5.50" className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md ${ errors.costPerUnit && touched.costPerUnit ? "border-red-500" : "" }`} />
                        </div>
                       <ErrorMessage name="costPerUnit" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                     {/* Total Cost (Display) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Total Cost (Calculated)</label>
                        <div className="mt-1">
                            <div className="block w-full py-2 px-3 sm:text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-700">
                                ${ (!isNaN(Number(values.quantity)) && !isNaN(Number(values.costPerUnit)))
                                    ? (Number(values.quantity) * Number(values.costPerUnit)).toFixed(2)
                                    : "0.00" }
                            </div>
                        </div>
                    </div>
                </div>


                {/* Project Selection */}
                <div>
                  <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select" name="project" id="project"
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ errors.project && touched.project ? "border-red-500" : "" } ${projectIdFromQuery ? 'bg-gray-100' : ''}`} // Removed cursor-not-allowed
                      disabled={isLoadingProjects || !!projectIdFromQuery} // Still disable if loading list or pre-selected
                    >
                      <option value="">{isLoadingProjects ? "Loading..." : "Select a project"}</option>
                      {projectsArray.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.projectName}
                        </option>
                      ))}
                    </Field>
                    {projectsError && <p className="mt-1 text-xs text-red-600">Error: {projectsError.message}</p>}
                    <ErrorMessage name="project" component="p" className="mt-1 text-xs text-red-600" />
                    {/* Project Budget Query component renders feedback here */}
                  </div>
                </div>

                {/* Grid for User / Status */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                   {/* Assigned User */}
                    <div>
                        <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                        Added By / Responsible User <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                        <Field
                            as="select" name="user" id="user"
                            className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ errors.user && touched.user ? "border-red-500" : "" }`}
                            disabled={isLoadingUsers}
                        >
                            <option value="">{isLoadingUsers ? "Loading..." : "Select a user"}</option>
                            {usersArray
                            ?.filter(user => ["admin", "project_manager", "contractor"].includes(user.role))
                            .map((user) => (
                                <option key={user._id} value={user._id}>
                                {user.firstName} {user.lastName} ({user.role.replace('_', ' ')})
                                </option>
                            ))}
                        </Field>
                        {usersError && <p className="mt-1 text-xs text-red-600">Error: {usersError.message}</p>}
                        <ErrorMessage name="user" component="p" className="mt-1 text-xs text-red-600" />
                        </div>
                    </div>
                     {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Initial Status <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                        <Field
                            as="select" name="status" id="status"
                            className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ errors.status && touched.status ? "border-red-500" : "" }`}
                        >
                            <option value="ordered">Ordered</option>
                            <option value="delivered">Delivered</option>
                        </Field>
                        <ErrorMessage name="status" component="p" className="mt-1 text-xs text-red-600" />
                        </div>
                    </div>
                </div>


                {/* Submit Button */}
                <div className="pt-5">
                  <div className="flex justify-end">
                    {/* ... Cancel button ... */}
                    <button type="button" onClick={() => navigate("/admin/materials")} disabled={formikIsSubmitting} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"> Cancel </button>
                    {/* --- Submit Button --- */}
                    <button
                      type="submit"
                      // Disable if Formik is submitting OR if project details are loading (important!)
                      disabled={formikIsSubmitting } // Removed isLoadingSelectedProject here, handled inside submit
                      className={`ml-3 inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                      ${ (formikIsSubmitting) // Check only formik state visually
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      } disabled:opacity-50`} // General disabled style
                    >
                      {formikIsSubmitting ? (
                        <> <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> Submitting... </>
                      ) : (
                        <> <CheckCircleIcon className="h-5 w-5 mr-2" /> Add Material </>
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
  );
};

export default CreateMaterial;