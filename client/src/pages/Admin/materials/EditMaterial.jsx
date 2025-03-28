

/*eslint-disable */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import materialsAPI from "../../../api/materials";
// import projectsAPI from "../../../api/projects"; // Not used in this form directly
// import usersAPI from "../../../api/users";     // Not used in this form directly
import authAPI from "../../../api/auth";

const EditMaterial = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // const [currentUser, setCurrentUser] = useState(null); // Not directly used after check
  // const [material, setMaterial] = useState(null); // REMOVE: Use data directly from useQuery

  useEffect(() => {
    // Check if user is admin
    const adminStatus = authAPI.isAdmin();
    setIsAdmin(adminStatus);
    // setCurrentUser(authAPI.getCurrentUser()); // Only needed if you use currentUser elsewhere

    if (!adminStatus) {
      toast.error("Access Denied: Admins only."); // Give feedback
      navigate("/dashboard"); // Redirect immediately
    }
  }, [navigate]);

  // Fetch material details using select to extract the nested data
  const {
    data: material, // Rename to 'material' as select returns the actual material object
    isLoading: isLoadingMaterial,
    error: materialError,
    isSuccess: isMaterialSuccess, // Use isSuccess to conditionally define initialValues
  } = useQuery({
    queryKey: ["materials", id],
    queryFn: () => materialsAPI.getMaterialById(id),
    // Use select to extract the actual material data from the response
    select: (response) => response.data,
    enabled: !!id && isAdmin, // Only run query if id exists and user is admin
    // No need for onSuccess to set local state anymore
  });

  // --- REMOVED UNUSED QUERIES for projects and users ---
  // If you need them for dropdowns later, add them back.

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: (values) => materialsAPI.updateMaterial(id, values),
    onSuccess: (response) => { // Get the updated material from response if backend sends it
      toast.success("Material updated successfully");
      // Invalidate queries to refetch lists
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      // Optionally update the specific material query cache if backend returns updated data
      queryClient.setQueryData(["materials", id], response); // Assuming response has { success: true, data: updatedMaterial }
      navigate("/admin/materials");
    },
    onError: (error) => {
      // Access potential backend error message
      const message = error?.message || error?.data?.message || "Failed to update material";
      toast.error(message);
      setIsSubmitting(false); // Ensure submitting state is reset on error
    },
    onSettled: () => {
        // This runs on both success and error
        // setIsSubmitting(false); // Moved setting false to only happen on error or end of success nav
    }
  });

  // Validation schema (remains the same)
  const validationSchema = Yup.object({
    materialName: Yup.string()
      .required("Material name is required")
      .max(100, "Material name cannot exceed 100 characters"),
    materialType: Yup.string()
      .required("Material type is required")
      .max(50, "Material type cannot exceed 50 characters"),
    quantity: Yup.number()
      .typeError("Quantity must be a number") // Add typeError for better feedback
      .required("Quantity is required")
      .min(0, "Quantity cannot be negative"),
    unit: Yup.string()
      .required("Unit is required")
      .max(20, "Unit cannot exceed 20 characters"),
    costPerUnit: Yup.number()
      .typeError("Cost must be a number") // Add typeError
      .required("Cost per unit is required")
      .min(0, "Cost per unit cannot be negative"),
    supplier: Yup.string()
      .required("Supplier is required")
      .max(100, "Supplier name cannot exceed 100 characters"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(
        ["ordered", "delivered", "in_use", "depleted"],
        "Invalid status"
      ),
  });

  // Define initialValues *conditionally* or inside Formik based on fetched data
  // This calculation now uses 'material' which directly holds the material object thanks to 'select'
  const initialValues = {
    materialName: material?.materialName || "",
    materialType: material?.materialType || "",
    quantity: material?.quantity ?? "", // Use nullish coalescing for potentially 0 values
    unit: material?.unit || "",
    costPerUnit: material?.costPerUnit ?? "", // Use nullish coalescing
    supplier: material?.supplier || "",
    status: material?.status || "ordered",
  };

  // Handle form submission
  const handleSubmit = (values) => {
    setIsSubmitting(true);

    // Calculate total cost
    const totalCost = Number(values.quantity) * Number(values.costPerUnit);

    // Ensure numeric types before sending
    const formattedValues = {
      ...values,
      quantity: Number(values.quantity),
      costPerUnit: Number(values.costPerUnit),
      totalCost: isNaN(totalCost) ? 0 : totalCost, // Handle potential NaN
    };

    console.log("Submitting updated material:", formattedValues);
    updateMaterialMutation.mutate(formattedValues);
  };

  // --- Loading and Error States ---
   if (!isAdmin) {
    // Early return if not admin (useEffect handles redirect, but this prevents flicker)
    return <div className="py-20 text-center text-red-600">Access Denied. Redirecting...</div>;
  }

  if (isLoadingMaterial) {
    return (
      <div className="py-20 text-center">
        <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
        <p className="mt-2 text-gray-500">Loading material details...</p>
      </div>
    );
  }

  if (materialError) {
    return (
      <div className="py-20 text-center">
        <p className="mt-2 text-xl font-semibold text-red-700">Error Loading Material</p>
        <p className="text-sm text-red-500">{materialError.message || "Could not fetch material details."}</p>
        <button
          onClick={() => navigate("/admin/materials")}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Materials
        </button>
      </div>
    );
  }

   // Ensure material data is actually present before rendering Formik
   if (!isMaterialSuccess || !material) {
       return (
           <div className="py-20 text-center">
               <p className="mt-2 text-gray-700">Material data could not be loaded.</p>
                <button
                  onClick={() => navigate("/admin/materials")}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Materials
                </button>
           </div>
       );
   }

  // --- Render Form ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Edit Material: {material?.materialName || ""}
          </h1>
          <p className="text-gray-500 text-sm">
            Update material details and information.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/materials")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Materials
        </button>
      </div>

      {/* Form Container */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {/* Only render Formik when material data is successfully loaded */}
          <Formik
            initialValues={initialValues} // Now correctly populated
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={false} // Keep false if preferred
            validateOnBlur={true}
            enableReinitialize={true} // Keep true
          >
            {({ errors, touched, values }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* Material Name */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="materialName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Material Name
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="materialName"
                        id="materialName"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.materialName && touched.materialName
                            ? "border-red-500"
                            : "border-gray-300" // Ensure default border color
                        }`}
                      />
                      <ErrorMessage
                        name="materialName"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  {/* Material Type */}
                  <div>
                    <label
                      htmlFor="materialType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Material Type
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="materialType"
                        id="materialType"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${
                          errors.materialType && touched.materialType
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <ErrorMessage
                        name="materialType"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label
                      htmlFor="supplier"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Supplier
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="supplier"
                        id="supplier"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${
                          errors.supplier && touched.supplier
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <ErrorMessage
                        name="supplier"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label
                      htmlFor="quantity"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Quantity
                    </label>
                    <div className="mt-1">
                      <Field
                        type="number"
                        name="quantity"
                        id="quantity"
                        min="0"
                        step="any" // Allow decimals
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${
                          errors.quantity && touched.quantity
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <ErrorMessage
                        name="quantity"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  {/* Unit */}
                  <div>
                    <label
                      htmlFor="unit"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Unit
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="unit"
                        id="unit"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${
                          errors.unit && touched.unit
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <ErrorMessage
                        name="unit"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  {/* Cost Per Unit */}
                  <div>
                    <label
                      htmlFor="costPerUnit"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Cost Per Unit
                    </label>
                    <div className="mt-1">
                      <Field
                        type="number"
                        name="costPerUnit"
                        id="costPerUnit"
                        min="0"
                        step="any" // Allow decimals
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${
                          errors.costPerUnit && touched.costPerUnit
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <ErrorMessage
                        name="costPerUnit"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  {/* Total Cost (Calculated) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Total Cost (Calculated)
                    </label>
                    <div className="mt-1">
                      <div className="shadow-sm block w-full py-2 px-3 sm:text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                        $
                        {values.quantity && values.costPerUnit && !isNaN(Number(values.quantity)) && !isNaN(Number(values.costPerUnit))
                          ? (
                              Number(values.quantity) * Number(values.costPerUnit)
                            ).toFixed(2)
                          : "0.00"}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Status
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="status"
                        id="status"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${
                          errors.status && touched.status
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="ordered">Ordered</option>
                        <option value="delivered">Delivered</option>
                        <option value="in_use">In Use</option>
                        <option value="depleted">Depleted</option>
                      </Field>
                      <ErrorMessage
                        name="status"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>
                </div> {/* End grid */}

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/materials")}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isSubmitting} // Disable cancel while submitting too
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                    ${
                      isSubmitting
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Update Material
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
  );
};

export default EditMaterial;