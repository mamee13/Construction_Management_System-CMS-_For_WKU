"use client"
/* eslint-disable */

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, CubeIcon } from "@heroicons/react/24/outline"
import materialsAPI from "../../../api/materials"
import authAPI from "../../../api/auth"

const EditMaterial = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentUser = authAPI.getCurrentUser()

  // Fetch material details
  const {
    data: materialData,
    isLoading: isLoadingMaterial,
    error: materialError,
  } = useQuery({
    queryKey: ["material", id],
    queryFn: () => materialsAPI.getMaterialById(id),
  })

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, data }) => materialsAPI.updateMaterial(id, data),
    onSuccess: () => {
      toast.success("Material updated successfully")
      navigate(`/contractor/materials/${id}`)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update material")
      setIsSubmitting(false)
    },
  })

  // Check if user can edit this material
  const canEditMaterial = () => {
    const material = materialData?.data
    if (!currentUser || !material) return false
    if (currentUser.role === "admin") return true
    if (currentUser.role === "contractor" && material.user?._id === currentUser._id) return true
    return false
  }

  // Validation schema
  const validationSchema = Yup.object({
    materialName: Yup.string()
      .required("Material name is required")
      .max(100, "Material name cannot exceed 100 characters"),
    materialType: Yup.string()
      .required("Material type is required")
      .max(50, "Material type cannot exceed 50 characters"),
    quantity: Yup.number().required("Quantity is required").min(0, "Quantity cannot be negative"),
    unit: Yup.string().required("Unit is required").max(20, "Unit cannot exceed 20 characters"),
    costPerUnit: Yup.number().required("Cost per unit is required").min(0, "Cost per unit cannot be negative"),
    supplier: Yup.string().required("Supplier is required").max(100, "Supplier cannot exceed 100 characters"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["ordered", "delivered", "in_use", "depleted"], "Invalid status"),
  })

  // Handle form submission
  const handleSubmit = (values) => {
    setIsSubmitting(true)

    // Format data for update
    const materialData = {
      ...values,
      quantity: Number(values.quantity),
      costPerUnit: Number(values.costPerUnit),
    }

    updateMaterialMutation.mutate({ id, data: materialData })
  }

  // Check if user is contractor or admin, redirect if not
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login")
      return
    }

    if (currentUser?.role !== "contractor" && currentUser?.role !== "admin") {
      navigate("/dashboard")
    }
  }, [currentUser, navigate])

  // Check if user can edit this material, redirect if not
  useEffect(() => {
    if (materialData && !canEditMaterial()) {
      toast.error("You don't have permission to edit this material")
      navigate(`/contractor/materials/${id}`)
    }
  }, [materialData, id, navigate])

  // Calculate total cost based on quantity and cost per unit
  const calculateTotalCost = (quantity, costPerUnit) => {
    const q = Number(quantity) || 0
    const c = Number(costPerUnit) || 0
    return q * c
  }

  // Prepare initial values from material data
  const material = materialData?.data
  const initialValues = material
    ? {
        materialName: material.materialName || "",
        materialType: material.materialType || "",
        quantity: material.quantity || "",
        unit: material.unit || "",
        costPerUnit: material.costPerUnit || "",
        supplier: material.supplier || "",
        status: material.status || "ordered",
      }
    : {
        materialName: "",
        materialType: "",
        quantity: "",
        unit: "",
        costPerUnit: "",
        supplier: "",
        status: "ordered",
      }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Material</h1>
          <p className="text-gray-500 text-sm">Update material details, costs, and status.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/contractor/materials/${id}`)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Material
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {isLoadingMaterial ? (
            <div className="text-center py-10">
              <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
              <p className="mt-2 text-gray-500">Loading material data...</p>
            </div>
          ) : materialError ? (
            <div className="text-center py-10">
              <p className="text-red-500">Failed to load material: {materialError.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Retry
              </button>
            </div>
          ) : (
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              validateOnChange={false}
              validateOnBlur={true}
              enableReinitialize={true}
            >
              {({ errors, touched, values, setFieldValue }) => (
                <Form className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    {/* Material Name */}
                    <div className="sm:col-span-2">
                      <label htmlFor="materialName" className="block text-sm font-medium text-gray-700">
                        Material Name
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="materialName"
                          id="materialName"
                          placeholder="Concrete Mix"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.materialName && touched.materialName ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="materialName" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    {/* Material Type */}
                    <div>
                      <label htmlFor="materialType" className="block text-sm font-medium text-gray-700">
                        Material Type
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="materialType"
                          id="materialType"
                          placeholder="Construction"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.materialType && touched.materialType ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="materialType" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    {/* Project (Read-only) */}
                    <div>
                      <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                        Project
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="project"
                          value={material?.project?.projectName || "Unknown Project"}
                          readOnly
                          className="bg-gray-50 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <p className="mt-1 text-sm text-gray-500">Project cannot be changed after creation</p>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <div className="mt-1">
                        <Field
                          type="number"
                          name="quantity"
                          id="quantity"
                          min="0"
                          step="0.01"
                          placeholder="100"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.quantity && touched.quantity ? "border-red-500" : ""
                          }`}
                          onChange={(e) => {
                            setFieldValue("quantity", e.target.value)
                          }}
                        />
                        <ErrorMessage name="quantity" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    {/* Unit */}
                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                        Unit
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="unit"
                          id="unit"
                          placeholder="kg"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.unit && touched.unit ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="unit" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    {/* Cost Per Unit */}
                    <div>
                      <label htmlFor="costPerUnit" className="block text-sm font-medium text-gray-700">
                        Cost Per Unit ($)
                      </label>
                      <div className="mt-1">
                        <Field
                          type="number"
                          name="costPerUnit"
                          id="costPerUnit"
                          min="0"
                          step="0.01"
                          placeholder="10.50"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.costPerUnit && touched.costPerUnit ? "border-red-500" : ""
                          }`}
                          onChange={(e) => {
                            setFieldValue("costPerUnit", e.target.value)
                          }}
                        />
                        <ErrorMessage name="costPerUnit" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    {/* Total Cost (Calculated, Read-only) */}
                    <div>
                      <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700">
                        Total Cost ($)
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="totalCost"
                          value={materialsAPI.formatCurrency(calculateTotalCost(values.quantity, values.costPerUnit))}
                          readOnly
                          className="bg-gray-50 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Supplier */}
                    <div>
                      <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                        Supplier
                      </label>
                      <div className="mt-1">
                        <Field
                          type="text"
                          name="supplier"
                          id="supplier"
                          placeholder="ABC Suppliers Inc."
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.supplier && touched.supplier ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="supplier" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
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
                          <option value="in_use">In Use</option>
                          <option value="depleted">Depleted</option>
                        </Field>
                        <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/contractor/materials/${id}`)}
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
                          Updating...
                        </>
                      ) : (
                        <>
                          <CubeIcon className="h-5 w-5 mr-2" />
                          Update Material
                        </>
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

export default EditMaterial

