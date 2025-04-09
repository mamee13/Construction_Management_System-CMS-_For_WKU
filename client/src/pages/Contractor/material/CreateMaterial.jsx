// "use client"
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
  CubeIcon,
} from "@heroicons/react/24/outline";
import materialsAPI from "../../../api/materials";
import projectsAPI from "../../../api/projects";
import usersAPI from "../../../api/users";
import authAPI from "../../../api/auth";

// --- Helper Component to Access Formik Values for Query ---
const ProjectBudgetQuery = ({ showBudgetWarning }) => {
  const { values } = useFormikContext();
  const selectedProjectId = values.project;

  const {
    data: selectedProjectData,
    isLoading: isLoadingSelectedProject,
    error: selectedProjectError,
    isSuccess: isSelectedProjectSuccess,
  } = useQuery({
    queryKey: ["projects", selectedProjectId],
    queryFn: () => projectsAPI.getProjectById(selectedProjectId),
    enabled: !!selectedProjectId,
    select: (apiResult) => apiResult?.data,
    staleTime: 1 * 60 * 1000,
  });

  useEffect(() => {
    if (isSelectedProjectSuccess && selectedProjectData) {
      // Assume 'projectBudget' holds the numeric budget for the project.
      showBudgetWarning(selectedProjectData.projectBudget);
    } else {
      showBudgetWarning(null);
    }
  }, [isSelectedProjectSuccess, selectedProjectData, showBudgetWarning, isLoadingSelectedProject]);

  return (
    <>
      {selectedProjectId && isLoadingSelectedProject && (
        <p className="mt-1 text-xs text-gray-500">Loading project budget...</p>
      )}
      {selectedProjectId && selectedProjectError && (
        <p className="mt-1 text-xs text-red-600">
          Error loading project details: {selectedProjectError?.message || 'Unknown error'}
        </p>
      )}
    </>
  );
};

const CreateMaterial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [budgetWarning, setBudgetWarning] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const projectIdFromQuery = queryParams.get("projectId");

  // Set user state and check authentication and roles
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);

    if (!authAPI.isAuthenticated()) {
      toast.info("Please log in to continue.");
      navigate("/login", { replace: true });
      return;
    }

    const role = user?.role;
    if (role !== "contractor" && role !== "admin") {
      toast.error("Access Denied: You do not have permission to add materials.");
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Fetch projects assigned to this user
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", currentUser?.role],
    queryFn: () => {
      if (!currentUser) return Promise.resolve(null);
      if (currentUser.role === "contractor") {
        return projectsAPI.getMyAssignedProjects();
      }
      return projectsAPI.getAllProjects();
    },
    enabled: !!currentUser,
  });

  // Process project data into an array
  const projectsArray = (() => {
    if (!projectsData) return [];
    return projectsData.data?.projects ?? projectsData.data ?? [];
  })();

  // Fetch users for dropdown if admin
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: usersAPI.getAllUsers,
    enabled: !!currentUser && currentUser.role === "admin",
  });

  const usersArray = (() => {
    if (!usersData) return [];
    return usersData.data?.users ?? usersData.data ?? [];
  })();

  // --- File Handling ---
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
      .min(0, "Must be non-negative")
      .typeError("Must be a number"),
    unit: Yup.string().required("Unit is required").max(20, "Max 20 chars"),
    costPerUnit: Yup.number()
      .required("Cost per unit is required")
      .min(0, "Must be non-negative")
      .typeError("Must be a number"),
    supplier: Yup.string().required("Supplier is required").max(100, "Max 100 chars"),
    project: Yup.string().required("Project is required"),
    user: Yup.string().when([], {
      is: () => currentUser?.role === "admin",
      then: (schema) => schema.required("Responsible user is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["ordered", "delivered"], "Invalid initial status"),
  });

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
  // This function receives the project budget and calculates the 75% limit.
  const handleBudgetCheck = (projectBudget) => {
    setBudgetWarning(null);
    if (
      projectBudget === null ||
      projectBudget === undefined ||
      isNaN(Number(projectBudget))
    ) {
      return;
    }
    const numericBudget = Number(projectBudget);
    const budgetLimit = numericBudget * 0.75;
    setBudgetWarning({
      limit: budgetLimit,
      totalBudget: numericBudget,
    });
  };

  // --- Create Material Mutation ---
  const createMaterialMutation = useMutation({
    mutationFn: (materialData) => materialsAPI.createMaterial(materialData),
    onSuccess: (data) => {
      toast.success("Material added successfully");
      const createdMaterial = data?.data;
      const projectId = createdMaterial?.project;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["materials", projectId] });
        queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["projects", currentUser?.role] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (currentUser?.role === "admin") {
        navigate("/admin/materials");
      } else {
        navigate("/contractor/materials");
      }
    },
    onError: (error) => {
      console.error("Create Material Error:", error);
      const message =
        error?.message ||
        error?.data?.message ||
        "Failed to add material.";
      toast.error(message);
      // Form submission state handled in onSettled below
    },
  });

  // --- Handle Form Submission ---
  const handleSubmit = async (values, { setSubmitting }) => {
    if (!currentUser?._id) {
      toast.error("User information not available. Please try again.");
      setSubmitting(false);
      return;
    }

    const quantity = Number(values.quantity);
    const costPerUnit = Number(values.costPerUnit);
    const newMaterialTotalCost =
      !isNaN(quantity) && !isNaN(costPerUnit) ? quantity * costPerUnit : 0;
    const selectedProjectId = values.project;

    if (!selectedProjectId) {
      toast.error("Please select a project.");
      setSubmitting(false);
      return;
    }

    // Budget check (same as before)
    let budgetExceeded = false;
    try {
      let projectData = queryClient.getQueryData(["projects", selectedProjectId]);
      if (!projectData) {
        console.log("Budget Check: Cache miss, fetching fresh...");
        const apiResult = await projectsAPI.getProjectById(selectedProjectId);
        projectData = apiResult?.data;
        if (!projectData) {
          throw new Error(apiResult?.message || "Could not get project details.");
        }
      } else {
        console.log("Budget Check: Using cache.");
      }
      const projectBudget = projectData?.projectBudget;
      if (
        projectBudget === undefined ||
        projectBudget === null ||
        isNaN(Number(projectBudget))
      ) {
        console.warn("Budget info missing/invalid:", projectData);
        toast.warn("Could not verify project budget. Proceeding cautiously.");
      } else {
        const numericBudget = Number(projectBudget);
        const budgetThreshold = numericBudget * 0.75;
        console.log(
          `Budget Check: Cost ($${newMaterialTotalCost.toFixed(
            2
          )}) vs Budget ($${numericBudget.toFixed(2)}). Limit: $${budgetThreshold.toFixed(2)}`
        );
        if (newMaterialTotalCost > budgetThreshold) {
          budgetExceeded = true;
          toast.error(
            `Cost Alert! Material cost ($${newMaterialTotalCost.toFixed(
              2
            )}) exceeds 75% of project budget ($${numericBudget.toFixed(
              2
            )}). Limit: $${budgetThreshold.toFixed(2)}. Submission Blocked.`,
            { autoClose: 10000 }
          );
          setSubmitting(false);
          return;
        }
      }
    } catch (error) {
      console.error("Budget check error:", error);
      toast.error(`Error checking budget: ${error.message}. Submission halted.`);
      setSubmitting(false);
      return;
    }

    // Prepare data for API submission
    const apiData = {
      ...values,
      quantity: quantity,
      costPerUnit: costPerUnit,
      totalCost: newMaterialTotalCost,
      user: currentUser.role === "admin" ? values.user : currentUser._id,
    };

    console.log("Submitting API Data:", apiData);
    createMaterialMutation.mutate(apiData, {
      onSettled: () => {
        setSubmitting(false);
      },
    });
  };

  // --- Conditional Disable for Submit Button ---
  // We compute a boolean to determine if the estimated cost exceeds the threshold.
  const computeDisableSubmit = (values) => {
    const quantity = Number(values.quantity);
    const costPerUnit = Number(values.costPerUnit);
    const totalCost =
      !isNaN(quantity) && !isNaN(costPerUnit) ? quantity * costPerUnit : 0;
    if (budgetWarning && totalCost > budgetWarning.limit) {
      return true;
    }
    return false;
  };

  if (!currentUser) {
    return <div className="p-10 text-center">Loading user data...</div>;
  }
  if (currentUser.role !== "admin" && currentUser.role !== "contractor") {
    return <div className="p-10 text-center">Access Denied.</div>;
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1.5 text-gray-500" />
          Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 text-center flex-grow">
          Add New Material
        </h1>
        <div className="w-16"></div>
      </div>
      <p className="text-gray-600 text-sm text-center mb-8">
        Enter the details for the new material below.
      </p>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={true}
            enableReinitialize={true}
          >
            {({ errors, touched, values, setFieldValue, dirty, isSubmitting: formikIsSubmitting }) => {
              // Calculate if we need to disable the button
              const disableSubmit = formikIsSubmitting || !dirty || computeDisableSubmit(values);
              return (
                <Form className="space-y-6">
                  <ProjectBudgetQuery showBudgetWarning={handleBudgetCheck} />

                  {budgetWarning && values.project && (
                    <div
                      className={`p-3 rounded-md border ${
                        Number(values.quantity) * Number(values.costPerUnit) > budgetWarning.limit
                          ? "bg-red-50 border-red-300"
                          : "bg-yellow-50 border-yellow-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <ExclamationTriangleIcon
                          className={`h-5 w-5 flex-shrink-0 ${
                            Number(values.quantity) * Number(values.costPerUnit) > budgetWarning.limit
                              ? "text-red-500"
                              : "text-yellow-500"
                          }`}
                          aria-hidden="true"
                        />
                        <div className="ml-3">
                          <h3
                            className={`text-sm font-medium ${
                              Number(values.quantity) * Number(values.costPerUnit) > budgetWarning.limit
                                ? "text-red-800"
                                : "text-yellow-800"
                            }`}
                          >
                            Budget Alert
                          </h3>
                          <div
                            className={`mt-1 text-xs ${
                              Number(values.quantity) * Number(values.costPerUnit) > budgetWarning.limit
                                ? "text-red-700"
                                : "text-yellow-700"
                            }`}
                          >
                            Project Budget: {materialsAPI.formatCurrency(budgetWarning.totalBudget)}.
                            <br />
                            75% Threshold: {materialsAPI.formatCurrency(budgetWarning.limit)}.
                            <br />
                            Current Est. Cost: {materialsAPI.formatCurrency(
                              (Number(values.quantity) * Number(values.costPerUnit)) || 0
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Material Name */}
                  <div>
                    <label htmlFor="materialName" className="block text-sm font-medium text-gray-700">
                      Material Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="materialName"
                        id="materialName"
                        placeholder="e.g., Portland Cement Type I"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.materialName && touched.materialName ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="materialName" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>

                  {/* Grid: Material Type / Supplier */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="materialType" className="block text-sm font-medium text-gray-700">
                        Material Type <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="materialType"
                          id="materialType"
                          placeholder="e.g., Binder, Aggregate"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.materialType && touched.materialType ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="materialType" component="p" className="mt-1 text-xs text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                        Supplier <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="supplier"
                          id="supplier"
                          placeholder="e.g., Construction Supply Co."
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.supplier && touched.supplier ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="supplier" component="p" className="mt-1 text-xs text-red-600" />
                      </div>
                    </div>
                  </div>

                  {/* Grid: Quantity / Unit / Cost Per Unit / Total Cost */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <Field
                          type="number"
                          name="quantity"
                          id="quantity"
                          min="0"
                          step="any"
                          placeholder="e.g., 500"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.quantity && touched.quantity ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="quantity" component="p" className="mt-1 text-xs text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="unit"
                          id="unit"
                          placeholder="e.g., kg, bags, m³"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.unit && touched.unit ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="unit" component="p" className="mt-1 text-xs text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="costPerUnit" className="block text-sm font-medium text-gray-700">
                        Cost Per Unit <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <Field
                          type="number"
                          name="costPerUnit"
                          id="costPerUnit"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 5.50"
                          className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-3 py-2 sm:text-sm border-gray-300 rounded-md ${
                            errors.costPerUnit && touched.costPerUnit ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      <ErrorMessage name="costPerUnit" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Total Cost (Calculated)</label>
                      <div className="mt-1">
                        <div className="block w-full py-2 px-3 sm:text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-700">
                          {materialsAPI.formatCurrency(
                            (Number(values.quantity) * Number(values.costPerUnit)) || 0
                          )}
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
                        as="select"
                        name="project"
                        id="project"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.project && touched.project ? "border-red-500" : ""
                        } ${projectIdFromQuery ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        disabled={isLoadingProjects || !!projectIdFromQuery}
                      >
                        <option value="">
                          {isLoadingProjects ? "Loading projects..." : "Select a project"}
                        </option>
                        {(projectsArray ?? []).map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.projectName}
                          </option>
                        ))}
                      </Field>
                      {isLoadingProjects && !projectsArray.length && (
                        <p className="mt-1 text-xs text-gray-500">Loading available projects...</p>
                      )}
                      {projectsError && (
                        <p className="mt-1 text-xs text-red-600">
                          Error loading projects: {projectsError.message}
                        </p>
                      )}
                      {!isLoadingProjects && !projectsError && !projectsArray.length && (
                        <p className="mt-1 text-xs text-gray-500">No projects available.</p>
                      )}
                      <ErrorMessage name="project" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>

                  {/* Grid: User / Status */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    {currentUser?.role === "admin" ? (
                      <div>
                        <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                          Responsible User <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <Field
                            as="select"
                            name="user"
                            id="user"
                            className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              errors.user && touched.user ? "border-red-500" : ""
                            }`}
                            disabled={isLoadingUsers}
                          >
                            <option value="">{isLoadingUsers ? "Loading users..." : "Select a user"}</option>
                            {(usersArray?.filter(u => u && u._id && u.role && ["admin", "project_manager", "contractor"].includes(u.role)) ?? []).map((u) => (
                              <option key={u._id} value={u._id}>
                                {`${u.firstName ?? ""} ${u.lastName ?? ""} (${u.role
                                  ? u.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                                  : "N/A"})`}
                              </option>
                            ))}
                          </Field>
                          {isLoadingUsers && !usersArray.length && (
                            <p className="mt-1 text-xs text-gray-500">Loading users...</p>
                          )}
                          {usersError && (
                            <p className="mt-1 text-xs text-red-600">
                              Error loading users: {usersError.message}
                            </p>
                          )}
                          <ErrorMessage name="user" component="p" className="mt-1 text-xs text-red-600" />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Added By</label>
                        <div className="mt-1">
                          <p className="block w-full py-2 px-3 sm:text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-700">
                            {currentUser?.firstName} {currentUser?.lastName} (You)
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Initial Status <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <Field
                          as="select"
                          name="status"
                          id="status"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.status && touched.status ? "border-red-500" : ""
                          }`}
                        >
                          <option value="ordered">Ordered</option>
                          <option value="delivered">Delivered</option>
                        </Field>
                        <ErrorMessage name="status" component="p" className="mt-1 text-xs text-red-600" />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button Area */}
                  <div className="pt-5">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(currentUser?.role === "admin" ? "/admin/materials" : "/contractor/materials")
                        }
                        disabled={formikIsSubmitting}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={disableSubmit}
                        className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                          disableSubmit
                            ? "bg-indigo-300 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
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
