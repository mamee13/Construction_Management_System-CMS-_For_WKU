

// src/components/Admin/UsersList.js OR wherever your component resides

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, EyeIcon, ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/outline"; // Added more icons
import { toast } from "react-toastify";
import authAPI from "@/APi/auth"; // Assuming "@/APi/..." paths are correct
import api from "@/APi"; // Import your configured API instance

// --- Edit User Modal Component (Keep as is) ---
const EditUserModal = ({ user, onClose, onUpdate }) => {
    // ... (Your existing EditUserModal code - no changes needed here) ...
     const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        isActive: user.isActive,
    });
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: (updatedData) => api.put(`/users/${user._id}`, updatedData),
        onSuccess: () => {
            toast.success("User updated successfully");
            queryClient.invalidateQueries({ queryKey: ["users"] });
            onUpdate(); // Close modal on successful update
        },
        onError: (error) => {
            const message = error.response?.data?.message || error.message || "Failed to update user";
            toast.error(message);
        },
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg p-6 z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto"> {/* Responsive width and max height */}
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                         </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Form fields */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white" required >
                            <option value="admin">Administrator</option>
                            <option value="consultant">Consultant</option>
                            <option value="contractor">Contractor</option>
                            <option value="project_manager">Project Manager</option>
                            <option value="committee">Committee Member</option>
                        </select>
                    </div>
                    <div className="mb-4 flex items-center">
                        <input type="checkbox" name="isActive" id="isActiveEdit" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2" />
                        <label htmlFor="isActiveEdit" className="text-sm font-medium text-gray-700">Active Account</label>
                    </div>
                    <div className="flex justify-end pt-4 border-t mt-4">
                        <button type="button" onClick={onClose} className="mr-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"> Cancel </button>
                        <button type="submit" className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 ${updateMutation.isPending ? 'animate-pulse' : ''}`} disabled={updateMutation.isPending} >
                            {updateMutation.isPending ? "Updating..." : "Update User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- User Detail Modal Component (UPDATED) ---
const UserDetailModal = ({ isLoading, error, userData, onClose }) => {
    // Extract user details and projects from userData prop
    const user = userData?.user;
    const projects = userData?.assignedProjects || []; // Default to empty array

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg p-6 z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto relative"> {/* Added relative for loading overlay */}
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800">User Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[200px]"> {/* Set min height to prevent collapse during load */}
                    {isLoading ? (
                         <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center flex-col">
                             <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
                             <p className="mt-2 text-gray-600">Loading details...</p>
                         </div>
                    ) : error ? (
                        <div className="text-center py-10 px-4">
                             <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto" />
                             <p className="mt-4 text-red-600 font-semibold">Failed to load details</p>
                             <p className="text-red-500 mt-1 text-sm">{error}</p>
                        </div>
                    ) : !user ? ( // Handle case where data might be null even if not loading/error
                        <div className="text-center py-10 text-gray-500">
                            No user data available.
                        </div>
                    ) : (
                        // Display User Data if loaded successfully
                        <div className="space-y-3 text-sm text-gray-700">
                            <div><span className="font-semibold text-gray-900">Name:</span> {user.firstName} {user.lastName}</div>
                            <div><span className="font-semibold text-gray-900">Email:</span> {user.email}</div>
                            <div><span className="font-semibold text-gray-900">Role:</span> {user.role}</div>
                            <div><span className="font-semibold text-gray-900">Phone:</span> {user.phone || "N/A"}</div>
                            <div>
                                <span className="font-semibold text-gray-900">Status:</span> {user.isActive ? <span className="text-green-600 font-medium">Active</span> : <span className="text-red-600 font-medium">Inactive</span>}
                            </div>
                            {/* --- UPDATED Section for Associated Projects --- */}
                            <div>
                                <span className="font-semibold text-gray-900">Assigned Projects:</span>
                                {/* Use the 'projects' array derived from the direct query */}
                                {projects.length > 0 ? (
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        {projects.map((proj) => (
                                            // Display proj.projectName (or other fields selected in backend)
                                            <li key={proj._id}>
                                                <span className="font-medium text-indigo-700">{proj.projectName || `Project (ID: ${proj._id})`}</span>
                                                {/* Optionally display status or other details fetched */}
                                                 {proj.status && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{proj.status}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-gray-500"> None</span>
                                )}
                            </div>
                            {/* --- END UPDATED SECTION --- */}
                            <div><span className="font-semibold text-gray-900">Joined On:</span> {new Date(user.createdAt).toLocaleDateString()}</div>
                            <div><span className="font-semibold text-gray-900">Last Updated:</span> {new Date(user.updatedAt).toLocaleDateString()}</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end pt-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Users List Component (UPDATED) ---
const UsersList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState(null); // State for Edit Modal

    // --- NEW STATE FOR VIEWING DETAILS ---
    const [viewingUserId, setViewingUserId] = useState(null);       // ID of user to view
    const [viewingUserData, setViewingUserData] = useState(null);   // Holds { user: ..., assignedProjects: ... }
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [detailError, setDetailError] = useState(null);
    // --- END NEW STATE ---

    // --- Data Fetching for the main list ---
    const { data: users, isLoading, error, isFetching: isListFetching } = useQuery({ // Renamed isFetching
        queryKey: ["users"],
        queryFn: async () => {
            const response = await api.get("/users"); // Fetches the list
            if (response?.data?.success && Array.isArray(response.data.data?.users)) {
                return response.data.data.users;
            } else {
                throw new Error(response?.data?.message || "Invalid data structure received from API");
            }
        },
        enabled: authAPI.isAdmin(),
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    });

    // --- Delete Mutation (Keep as is) ---
    const deleteMutation = useMutation({
        mutationFn: (userId) => api.delete(`/users/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User deleted successfully");
        },
        onError: (error) => {
             const message = error.response?.data?.message || error.message || "Failed to delete user";
            toast.error(message);
        },
    });

    const handleDelete = (userId) => {
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            deleteMutation.mutate(userId);
        }
    };

    // --- Filtering Logic (Keep as is) ---
    const filteredUsers = users?.filter((user) => {
        // ... (your existing filtering logic) ...
        const searchLower = searchTerm.toLowerCase();
        return (
            (user.firstName?.toLowerCase() || '').includes(searchLower) ||
            (user.lastName?.toLowerCase() || '').includes(searchLower) ||
            (user.email?.toLowerCase() || '').includes(searchLower) ||
            (user.role?.toLowerCase() || '').includes(searchLower)
        );
    }) || [];

    // --- Admin Check & Redirect (Keep as is) ---
    if (!authAPI.isAdmin()) {
        navigate("/dashboard");
        return null;
    }

    // --- UI Helper Objects (Keep as is) ---
    const roleColors = { /* ... */ };
    const roleLabels = { /* ... */ };

    // --- NEW: Function to handle fetching and showing details ---
    const handleViewDetails = async (userId) => {
        console.log(`Fetching details for user ID: ${userId}`);
        setViewingUserId(userId);     // Set the ID to trigger modal rendering
        setIsFetchingDetails(true);   // Show loading state
        setDetailError(null);         // Clear previous errors
        setViewingUserData(null);     // Clear previous data

        try {
            // Make the API call to the specific user endpoint
            const response = await api.get(`/users/${userId}`);

            if (response.data.success && response.data.data) {
                // Store the complete data object { user: ..., assignedProjects: ... }
                setViewingUserData(response.data.data);
                console.log("Fetched user details:", response.data.data);
            } else {
                // Handle backend success:false or missing data
                throw new Error(response.data.message || 'Failed to fetch user details');
            }
        } catch (err) {
            console.error("Error fetching user details:", err);
            const message = err.response?.data?.message || err.message || "Could not load user details.";
            setDetailError(message);
            toast.error(`Failed to load details: ${message}`); // Optional toast message
        } finally {
            setIsFetchingDetails(false); // Hide loading state
        }
    };

    // --- Function to close the detail modal ---
    const handleCloseDetailModal = () => {
        setViewingUserId(null);
        setViewingUserData(null);
        setIsFetchingDetails(false);
        setDetailError(null);
    };

    // --- Render Component ---
    return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
                    <p className="text-gray-500 text-sm">Manage users, roles, and permissions.</p>
                </div>
                <button type="button" onClick={() => navigate("/admin/users/register")} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" >
                    <UserPlusIcon className="h-5 w-5 mr-2" /> Add New User
                </button>
            </div>

            {/* Search Bar Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="px-4 py-5 sm:p-6">
                    {/* ... (your search input code) ... */}
                     <div className="max-w-lg w-full lg:max-w-xs">
                         <label htmlFor="search" className="sr-only">Search Users</label>
                         <div className="relative">
                             <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                                </svg>
                             </div>
                            <input id="search" name="search" className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Search by name, email, or role" type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                         </div>
                     </div>
                </div>
            </div>

            {/* Users Table Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? ( // Loading state for the main list
                    <div className="text-center py-20">
                        <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
                        <p className="mt-2 text-gray-500">Loading users...</p>
                    </div>
                ) : error ? ( // Error state for the main list
                    <div className="text-center py-20 px-4">
                        <p className="text-red-600 font-semibold">Failed to load users:</p>
                        <p className="text-red-500 mt-1">{error.message}</p>
                        <button onClick={() => queryClient.refetchQueries({ queryKey: ["users"] })} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" >
                            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isListFetching ? 'animate-spin' : ''}`} /> Retry
                        </button>
                    </div>
                ) : filteredUsers.length === 0 ? ( // Empty state
                    <div className="text-center py-20 px-4">
                         <p className="text-gray-500">
                             {searchTerm ? "No users match your search criteria." : "No users found. Add a new user to get started."}
                         </p>
                         {searchTerm && (
                             <button onClick={() => setSearchTerm("")} className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" >
                                 Clear Search
                             </button>
                         )}
                    </div>
                ) : ( // Render the table
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Name </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Email </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Role </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Contact </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Status </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"> Actions </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        {/* Table Data Cells (keep as is) */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <span className="text-gray-600 font-medium">{user.firstName?.[0] || '?'}{user.lastName?.[0] || '?'}</span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{user.email}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>{roleLabels[user.role] || user.role}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{user.isActive ? "Active" : "Inactive"}</span></td>
                                        {/* Action Buttons */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                                            {/* --- UPDATED VIEW BUTTON --- */}
                                            <button
                                                 title="View Details"
                                                 onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDetails(user._id); // Call the fetch details handler
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                                disabled={isFetchingDetails && viewingUserId === user._id} // Disable while fetching this user's details
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                                <span className="sr-only">View Details</span>
                                            </button>
                                            {/* --- END UPDATED VIEW BUTTON --- */}
                                            <button title="Edit User" onClick={(e) => { e.stopPropagation(); setEditingUser(user); }} className="text-indigo-600 hover:text-indigo-900" >
                                                <PencilSquareIcon className="h-5 w-5" />
                                                <span className="sr-only">Edit</span>
                                            </button>
                                            <button title="Delete User" onClick={(e) => { e.stopPropagation(); handleDelete(user._id); }} className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed" disabled={user.role === "admin" && users?.filter((u) => u.role === "admin").length <= 1 || deleteMutation.isPending} >
                                                <TrashIcon className="h-5 w-5" />
                                                <span className="sr-only">Delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Placeholder (Keep as is or implement fully) */}
            {/* ... (your pagination code) ... */}

            {/* --- Render Modals --- */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUpdate={() => setEditingUser(null)}
                />
            )}

            {/* --- UPDATED Detail Modal Rendering --- */}
            {viewingUserId && ( // Render modal based on viewingUserId being set
                <UserDetailModal
                    isLoading={isFetchingDetails}
                    error={detailError}
                    userData={viewingUserData} // Pass the complete fetched data object
                    onClose={handleCloseDetailModal} // Use the specific close handler
                />
            )}
             {/* --- END UPDATED Detail Modal Rendering --- */}

        </div>
    );
};

export default UsersList;