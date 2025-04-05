"use client"
/* eslint-disable */

import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  BuildingOfficeIcon,
  CubeIcon,
  TruckIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline"
import { toast } from "react-toastify"
import materialsAPI from "../../../api/materials"
import authAPI from "../../../api/auth"

const MaterialDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = authAPI.getCurrentUser()

  // Fetch material details
  const {
    data: materialData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["material", id],
    queryFn: () => materialsAPI.getMaterialById(id),
  })

  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: materialsAPI.deleteMaterial,
    onSuccess: () => {
      toast.success("Material deleted successfully")
      navigate("/contractor/materials")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete material")
    },
  })

  // Check if user can edit/delete this material
  const canModifyMaterial = () => {
    const material = materialData?.data
    if (!currentUser || !material) return false
    if (currentUser.role === "admin") return true
    if (currentUser.role === "contractor" && material.user?._id === currentUser._id) return true
    return false
  }

  // Handle material deletion
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      deleteMutation.mutate(id)
    }
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

  const material = materialData?.data

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {isLoading ? "Loading Material..." : material?.materialName}
          </h1>
          <p className="text-gray-500 text-sm">View material details, costs, and supplier information.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={() => navigate("/contractor/materials")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Materials
          </button>
          {canModifyMaterial() && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/contractor/materials/edit/${id}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Edit Material
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete Material
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 bg-white shadow rounded-lg">
          <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
          <p className="mt-2 text-gray-500">Loading material details...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white shadow rounded-lg">
          <p className="text-red-500">Failed to load material: {error.message}</p>
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
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Material Information</h3>
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${materialsAPI.getStatusBadgeColor(
                  material.status,
                )}`}
              >
                {materialsAPI.formatStatus(material.status)}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Material Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{material.materialName}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CubeIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Material Type
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{material.materialType}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Project
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{material.project?.projectName || "Unknown Project"}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {material.quantity} {material.unit}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Cost Per Unit
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {materialsAPI.formatCurrency(material.costPerUnit)} per {material.unit}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Total Cost
                </dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">
                  {materialsAPI.formatCurrency(material.totalCost)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <TruckIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Supplier
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{material.supplier}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Added By</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {material.user ? `${material.user.firstName} ${material.user.lastName}` : "Unknown"}
                  {material.user?._id === currentUser?._id ? " (You)" : ""}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Added On</dt>
                <dd className="mt-1 text-sm text-gray-900">{materialsAPI.formatDate(material.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaterialDetail

