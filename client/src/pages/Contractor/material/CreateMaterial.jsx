"use client"
/* eslint-disable */

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, CubeIcon } from "@heroicons/react/24/outline"
import materialsAPI from "../../../api/materials"
import projectsAPI from "../../../api/projects"
import authAPI from "../../../api/auth"

const CreateMaterial = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentUser = authAPI.getCurrentUser()

  // Fetch projects - for contractors, only fetch assigned projects
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => {
      // If contractor, fetch only assigned projects
      if (currentUser?.role === "contractor") {
        return projectsAPI.getMyAssignedProjects()
      }
      // If admin, fetch all projects
      return projectsAPI.getAllProjects()
    },
  })

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: materialsAPI.createMaterial,
    onSuccess: () => {
      toast.success("Material created successfully")
      navigate("/contractor/materials")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create material")
      setIsSubmitting(false)
    },
  })

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
    project: Yup.string().required("Project is required"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["ordered", "delivered", "in_use", "depleted"], "Invalid status"),
  })

  // Initial form values
  const initialValues = {
    materialName: "",
    materialType: "",
    quantity: "",
    unit: "",
    costPerUnit: "",
    supplier: "",
    project: "",
    status: "ordered",
  }

  // Handle form submission
  const handleSubmit = (values) => {
    setIsSubmitting(true)

    // Add user ID to the material data
    const materialData = {
      ...values,
      quantity: Number(values.quantity),
      costPerUnit: Number(values.costPerUnit),
      user: currentUser._id,
    }

    createMaterialMutation.mutate(materialData)
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

  // Calculate total cost based on quantity and cost per unit
  const calculateTotalCost = (quantity, costPerUnit) => {
    const q = Number(quantity) || 0
    const c = Number(costPerUnit) || 0
    return q * c
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Add New Material</h1>
          <p className="text-gray-500 text-sm">Add a new material to a project.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/contractor/materials")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Materials
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

                  {/* Project */}
                  <div>
                    <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                      Project
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="project"
                        id="project"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.project && touched.project ? "border-red-500" : ""
                        }`}
                        disabled={isLoadingProjects}
                      >
                        <option value="">Select a project</option>
                        {projectsData?.data?.projects?.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.projectName}
                          </option>
                        ))}
                      </Field>
                      {isLoadingProjects && <p className="mt-1 text-sm text-gray-500">Loading projects...</p>}
                      {projectsError && (
                        <p className="mt-1 text-sm text-red-600">Error loading projects: {projectsError.message}</p>
                      )}
                      <ErrorMessage name="project" component="p" className="mt-1 text-sm text-red-600" />
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
                    onClick={() => navigate("/contractor/materials")}
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
                        <CubeIcon className="h-5 w-5 mr-2" />
                        Add Material
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

export default CreateMaterial

