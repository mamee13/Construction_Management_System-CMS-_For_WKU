"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import {
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CubeIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline"
import materialsAPI from "../../../api/materials"
import authAPI from "../../../api/auth"

const MaterialDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // Check if user is admin
    const adminStatus = authAPI.isAdmin()
    setIsAdmin(adminStatus)
    setCurrentUser(authAPI.getCurrentUser())

    if (!adminStatus) {
      navigate("/dashboard")
    }
  }, [navigate])

  // Fetch material details
  const {
    data: materialData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["materials", id],
    queryFn: () => materialsAPI.getMaterialById(id),
  })

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: () => materialsAPI.deleteMaterial(id, currentUser?._id),
    onSuccess: () => {
      toast.success("Material deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["materials"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      navigate("/admin/materials")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete material")
      setIsDeleting(false)
    },
  })

  // Handle delete material
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      setIsDeleting(true)
      deleteMaterialMutation.mutate()
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "ordered":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Ordered
          </span>
        )
      case "delivered":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Delivered
          </span>
        )
      case "in_use":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            In Use
          </span>
        )
      case "depleted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Depleted
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </span>
        )
    }
  }

  if (!isAdmin) {
    return null
  }

  const material = materialData?.data?.material

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/materials")}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Materials
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
          <p className="mt-2 text-gray-500">Loading material details...</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
          <p className="mt-2 text-gray-700">Error loading material details</p>
          <p className="text-sm text-red-500">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Material Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Detailed information about the selected material.</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/admin/materials/edit/${id}`)}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Material
              </button>
              {(isAdmin || (currentUser && material?.user && material.user._id === currentUser._id)) && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {isDeleting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Material
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Material Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                  <CubeIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  {material?.materialName}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Material Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{material?.materialType}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Project</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  {material?.project?.projectName || "No project assigned"}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {material?.quantity} {material?.unit}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Cost Information</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-indigo-500 mr-2" />
                      <span className="font-medium">Cost Per Unit:</span>
                      <span className="ml-2">
                        {material?.costPerUnit && formatCurrency(material.costPerUnit)} per {material?.unit}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-indigo-500 mr-2" />
                      <span className="font-medium">Total Cost:</span>
                      <span className="ml-2">{material?.totalCost && formatCurrency(material.totalCost)}</span>
                    </div>
                  </div>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{material?.supplier}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {material?.status && getStatusBadge(material.status)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Added By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                  <UserIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  {material?.user ? (
                    <span>
                      {material.user.firstName} {material.user.lastName} ({material.user.role})
                    </span>
                  ) : (
                    <span className="text-gray-500">Unknown</span>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {material?.createdAt && formatDate(material.createdAt)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {material?.updatedAt && formatDate(material.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaterialDetail

