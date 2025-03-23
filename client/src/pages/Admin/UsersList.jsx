


// // import { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// // import { UserPlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
// // import { toast } from "react-toastify";
// // import authAPI from "@/APi/auth";
// // import api from "@/APi";

// // const UsersList = () => {
// //   const navigate = useNavigate();
// //   const queryClient = useQueryClient();
// //   const [searchTerm, setSearchTerm] = useState("");

// //   // Fetch users from the new user endpoint
// //   const { data, isLoading, error } = useQuery({
// //     queryKey: ["users"],
// //     queryFn: async () => {
// //       const response = await api.get("/users");
// //       return response.data.data; // directly returns array of users
// //     },
// //     enabled: authAPI.isAdmin(),
// //   });

// //   // Delete user mutation
// //   const deleteMutation = useMutation({
// //     mutationFn: (userId) => api.delete(`/users/${userId}`),
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ["users"] });
// //       toast.success("User deleted successfully");
// //     },
// //     onError: (error) => {
// //       toast.error(error.message || "Failed to delete user");
// //     },
// //   });

// //   // Handle user deletion
// //   const handleDelete = (userId) => {
// //     if (window.confirm("Are you sure you want to delete this user?")) {
// //       deleteMutation.mutate(userId);
// //     }
// //   };

// //   // Filter users based on search term (using the array directly)
// //   const filteredUsers = data?.filter((user) => {
// //     const searchLower = searchTerm.toLowerCase();
// //     return (
// //       user.firstName.toLowerCase().includes(searchLower) ||
// //       user.lastName.toLowerCase().includes(searchLower) ||
// //       user.email.toLowerCase().includes(searchLower) ||
// //       user.role.toLowerCase().includes(searchLower)
// //     );
// //   });

// //   // Redirect if the current user is not an admin
// //   if (!authAPI.isAdmin()) {
// //     navigate("/dashboard");
// //     return null;
// //   }

// //   // Role color mapping
// //   const roleColors = {
// //     admin: "bg-purple-100 text-purple-800",
// //     consultant: "bg-blue-100 text-blue-800",
// //     contractor: "bg-green-100 text-green-800",
// //     project_manager: "bg-yellow-100 text-yellow-800",
// //     committee: "bg-red-100 text-red-800",
// //   };

// //   // Role label mapping
// //   const roleLabels = {
// //     admin: "Administrator",
// //     consultant: "Consultant",
// //     contractor: "Contractor",
// //     project_manager: "Project Manager",
// //     committee: "Committee Member",
// //   };

// //   return (
// //     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
// //       <div className="sm:flex sm:items-center sm:justify-between mb-8">
// //         <div>
// //           <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
// //           <p className="text-gray-500 text-sm">
// //             Manage users, their roles, and permissions in the WKU Construction Management System.
// //           </p>
// //         </div>
// //         <button
// //           type="button"
// //           onClick={() => navigate("/admin/users/register")}
// //           className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //         >
// //           <UserPlusIcon className="h-5 w-5 mr-2" />
// //           Add New User
// //         </button>
// //       </div>

// //       {/* Search and filter */}
// //       <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
// //         <div className="px-4 py-5 sm:p-6">
// //           <div className="max-w-lg w-full">
// //             <label htmlFor="search" className="sr-only">
// //               Search Users
// //             </label>
// //             <div className="relative">
// //               <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
// //                 <svg
// //                   className="h-5 w-5 text-gray-400"
// //                   xmlns="http://www.w3.org/2000/svg"
// //                   viewBox="0 0 20 20"
// //                   fill="currentColor"
// //                 >
// //                   <path
// //                     fillRule="evenodd"
// //                     d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
// //                     clipRule="evenodd"
// //                   />
// //                 </svg>
// //               </div>
// //               <input
// //                 id="search"
// //                 name="search"
// //                 className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
// //                 placeholder="Search by name, email, or role"
// //                 type="search"
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //               />
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Users list */}
// //       <div className="bg-white shadow rounded-lg overflow-hidden">
// //         {isLoading ? (
// //           <div className="text-center py-20">
// //             <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
// //             <p className="mt-2 text-gray-500">Loading users...</p>
// //           </div>
// //         ) : error ? (
// //           <div className="text-center py-20">
// //             <p className="text-red-500">Failed to load users: {error.message}</p>
// //             <button
// //               onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
// //               className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //             >
// //               <ArrowPathIcon className="h-5 w-5 mr-2" />
// //               Retry
// //             </button>
// //           </div>
// //         ) : filteredUsers?.length === 0 ? (
// //           <div className="text-center py-20">
// //             <p className="text-gray-500">
// //               {searchTerm ? "No users match your search criteria." : "No users found."}
// //             </p>
// //             {searchTerm && (
// //               <button
// //                 onClick={() => setSearchTerm("")}
// //                 className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //               >
// //                 Clear Search
// //               </button>
// //             )}
// //           </div>
// //         ) : (
// //           <div className="overflow-x-auto">
// //             <table className="min-w-full divide-y divide-gray-200">
// //               <thead className="bg-gray-50">
// //                 <tr>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Name
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Email
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Role
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Contact
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Status
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Actions
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody className="bg-white divide-y divide-gray-200">
// //                 {filteredUsers?.map((user) => (
// //                   <tr key={user._id} className="hover:bg-gray-50">
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="flex items-center">
// //                         <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
// //                           <span className="text-indigo-800 font-medium">
// //                             {user.firstName[0]}
// //                             {user.lastName[0]}
// //                           </span>
// //                         </div>
// //                         <div className="ml-4">
// //                           <div className="text-sm font-medium text-gray-900">
// //                             {user.firstName} {user.lastName}
// //                           </div>
// //                           <div className="text-sm text-gray-500">ID: {user._id.substring(0, 8)}...</div>
// //                         </div>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="text-sm text-gray-900">{user.email}</div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
// //                         {roleLabels[user.role]}
// //                       </span>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
// //                         {user.isActive ? "Active" : "Inactive"}
// //                       </span>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
// //                       <button onClick={() => navigate(`/admin/users/edit/${user._id}`)} className="text-indigo-600 hover:text-indigo-900 mr-4">
// //                         <PencilSquareIcon className="h-5 w-5" />
// //                         <span className="sr-only">Edit</span>
// //                       </button>
// //                       <button
// //                         onClick={() => handleDelete(user._id)}
// //                         className="text-red-600 hover:text-red-900"
// //                         disabled={user.role === "admin" && filteredUsers.filter((u) => u.role === "admin").length === 1}
// //                       >
// //                         <TrashIcon className="h-5 w-5" />
// //                         <span className="sr-only">Delete</span>
// //                       </button>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         )}
// //       </div>

// //       {/* Pagination - can be implemented if needed */}
// //       <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
// //         <div className="flex-1 flex justify-between sm:hidden">
// //           <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
// //             Previous
// //           </button>
// //           <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
// //             Next
// //           </button>
// //         </div>
// //         <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
// //           <div>
// //             <p className="text-sm text-gray-700">
// //               Showing <span className="font-medium">1</span> to{" "}
// //               <span className="font-medium">{filteredUsers?.length || 0}</span> of{" "}
// //               <span className="font-medium">{filteredUsers?.length || 0}</span> results
// //             </p>
// //           </div>
// //           <div>
// //             <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
// //               <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
// //                 <span className="sr-only">Previous</span>
// //                 <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
// //                   <path
// //                     fillRule="evenodd"
// //                     d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
// //                     clipRule="evenodd"
// //                   />
// //                 </svg>
// //               </button>
// //               <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
// //                 1
// //               </button>
// //               <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
// //                 <span className="sr-only">Next</span>
// //                 <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
// //                   <path
// //                     fillRule="evenodd"
// //                     d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
// //                     clipRule="evenodd"
// //                   />
// //                 </svg>
// //               </button>
// //             </nav>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default UsersList;


// // import { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// // import { UserPlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
// // import { toast } from "react-toastify";
// // import authAPI from "@/APi/auth";
// // import api from "@/APi";

// // // Modal component for editing a user
// // const EditUserModal = ({ user, onClose, onUpdate }) => {
// //   const [formData, setFormData] = useState({
// //     firstName: user.firstName,
// //     lastName: user.lastName,
// //     email: user.email,
// //     phone: user.phone || "",
// //     role: user.role,
// //     isActive: user.isActive
// //   });
// //   const queryClient = useQueryClient();

// //   const updateMutation = useMutation({
// //     mutationFn: (updatedData) => api.put(`/users/${user._id}`, updatedData),
// //     onSuccess: () => {
// //       toast.success("User updated successfully");
// //       queryClient.invalidateQueries({ queryKey: ["users"] });
// //       onUpdate();
// //     },
// //     onError: (error) => {
// //       toast.error(error.message || "Failed to update user");
// //     }
// //   });

// //   const handleChange = (e) => {
// //     const { name, value, type, checked } = e.target;
// //     setFormData((prev) => ({
// //       ...prev,
// //       [name]: type === "checkbox" ? checked : value
// //     }));
// //   };

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     updateMutation.mutate(formData);
// //   };

// //   return (
// //     <div className="fixed inset-0 flex items-center justify-center z-50">
// //       {/* Modal overlay */}
// //       <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
// //       {/* Modal content */}
// //       <div className="bg-white rounded-lg p-6 z-10 w-1/3">
// //         <h2 className="text-xl font-bold mb-4">Edit User</h2>
// //         <form onSubmit={handleSubmit}>
// //           <div className="mb-4">
// //             <label className="block text-sm font-medium text-gray-700">First Name</label>
// //             <input
// //               type="text"
// //               name="firstName"
// //               value={formData.firstName}
// //               onChange={handleChange}
// //               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
// //               required
// //             />
// //           </div>
// //           <div className="mb-4">
// //             <label className="block text-sm font-medium text-gray-700">Last Name</label>
// //             <input
// //               type="text"
// //               name="lastName"
// //               value={formData.lastName}
// //               onChange={handleChange}
// //               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
// //               required
// //             />
// //           </div>
// //           <div className="mb-4">
// //             <label className="block text-sm font-medium text-gray-700">Email</label>
// //             <input
// //               type="email"
// //               name="email"
// //               value={formData.email}
// //               onChange={handleChange}
// //               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
// //               required
// //             />
// //           </div>
// //           <div className="mb-4">
// //             <label className="block text-sm font-medium text-gray-700">Phone</label>
// //             <input
// //               type="text"
// //               name="phone"
// //               value={formData.phone}
// //               onChange={handleChange}
// //               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
// //             />
// //           </div>
// //           <div className="mb-4">
// //             <label className="block text-sm font-medium text-gray-700">Role</label>
// //             <select
// //               name="role"
// //               value={formData.role}
// //               onChange={handleChange}
// //               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
// //               required
// //             >
// //               <option value="admin">Administrator</option>
// //               <option value="consultant">Consultant</option>
// //               <option value="contractor">Contractor</option>
// //               <option value="project_manager">Project Manager</option>
// //               <option value="committee">Committee Member</option>
// //             </select>
// //           </div>
// //           <div className="mb-4 flex items-center">
// //             <input
// //               type="checkbox"
// //               name="isActive"
// //               checked={formData.isActive}
// //               onChange={handleChange}
// //               className="mr-2"
// //             />
// //             <label className="text-sm font-medium text-gray-700">Active</label>
// //           </div>
// //           <div className="flex justify-end">
// //             <button type="button" onClick={onClose} className="mr-4 px-4 py-2 bg-gray-300 text-gray-800 rounded">
// //               Cancel
// //             </button>
// //             <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
// //               Update User
// //             </button>
// //           </div>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // };

// // const UsersList = () => {
// //   const navigate = useNavigate();
// //   const queryClient = useQueryClient();
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [editingUser, setEditingUser] = useState(null);

// //   // Fetch users from the new user endpoint
// //   const { data, isLoading, error } = useQuery({
// //     queryKey: ["users"],
// //     queryFn: async () => {
// //       const response = await api.get("/users");
// //       return response.data.data; // returns an array of users
// //     },
// //     enabled: authAPI.isAdmin(),
// //   });

// //   // Delete user mutation
// //   const deleteMutation = useMutation({
// //     mutationFn: (userId) => api.delete(`/users/${userId}`),
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ["users"] });
// //       toast.success("User deleted successfully");
// //     },
// //     onError: (error) => {
// //       toast.error(error.message || "Failed to delete user");
// //     },
// //   });

// //   // Handle user deletion
// //   const handleDelete = (userId) => {
// //     if (window.confirm("Are you sure you want to delete this user?")) {
// //       deleteMutation.mutate(userId);
// //     }
// //   };

// //   // Filter users based on search term
// //   const filteredUsers = data?.filter((user) => {
// //     const searchLower = searchTerm.toLowerCase();
// //     return (
// //       user.firstName.toLowerCase().includes(searchLower) ||
// //       user.lastName.toLowerCase().includes(searchLower) ||
// //       user.email.toLowerCase().includes(searchLower) ||
// //       user.role.toLowerCase().includes(searchLower)
// //     );
// //   });

// //   // Redirect if the current user is not an admin
// //   if (!authAPI.isAdmin()) {
// //     navigate("/dashboard");
// //     return null;
// //   }

// //   // Role color mapping
// //   const roleColors = {
// //     admin: "bg-purple-100 text-purple-800",
// //     consultant: "bg-blue-100 text-blue-800",
// //     contractor: "bg-green-100 text-green-800",
// //     project_manager: "bg-yellow-100 text-yellow-800",
// //     committee: "bg-red-100 text-red-800",
// //   };

// //   // Role label mapping
// //   const roleLabels = {
// //     admin: "Administrator",
// //     consultant: "Consultant",
// //     contractor: "Contractor",
// //     project_manager: "Project Manager",
// //     committee: "Committee Member",
// //   };

// //   return (
// //     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
// //       <div className="sm:flex sm:items-center sm:justify-between mb-8">
// //         <div>
// //           <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
// //           <p className="text-gray-500 text-sm">
// //             Manage users, their roles, and permissions in the WKU Construction Management System.
// //           </p>
// //         </div>
// //         <button
// //           type="button"
// //           onClick={() => navigate("/admin/users/register")}
// //           className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //         >
// //           <UserPlusIcon className="h-5 w-5 mr-2" />
// //           Add New User
// //         </button>
// //       </div>

// //       {/* Search and filter */}
// //       <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
// //         <div className="px-4 py-5 sm:p-6">
// //           <div className="max-w-lg w-full">
// //             <label htmlFor="search" className="sr-only">
// //               Search Users
// //             </label>
// //             <div className="relative">
// //               <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
// //                 <svg
// //                   className="h-5 w-5 text-gray-400"
// //                   xmlns="http://www.w3.org/2000/svg"
// //                   viewBox="0 0 20 20"
// //                   fill="currentColor"
// //                 >
// //                   <path
// //                     fillRule="evenodd"
// //                     d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
// //                     clipRule="evenodd"
// //                   />
// //                 </svg>
// //               </div>
// //               <input
// //                 id="search"
// //                 name="search"
// //                 className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
// //                 placeholder="Search by name, email, or role"
// //                 type="search"
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //               />
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Users list */}
// //       <div className="bg-white shadow rounded-lg overflow-hidden">
// //         {isLoading ? (
// //           <div className="text-center py-20">
// //             <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
// //             <p className="mt-2 text-gray-500">Loading users...</p>
// //           </div>
// //         ) : error ? (
// //           <div className="text-center py-20">
// //             <p className="text-red-500">Failed to load users: {error.message}</p>
// //             <button
// //               onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
// //               className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //             >
// //               <ArrowPathIcon className="h-5 w-5 mr-2" />
// //               Retry
// //             </button>
// //           </div>
// //         ) : filteredUsers?.length === 0 ? (
// //           <div className="text-center py-20">
// //             <p className="text-gray-500">
// //               {searchTerm ? "No users match your search criteria." : "No users found."}
// //             </p>
// //             {searchTerm && (
// //               <button
// //                 onClick={() => setSearchTerm("")}
// //                 className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //               >
// //                 Clear Search
// //               </button>
// //             )}
// //           </div>
// //         ) : (
// //           <div className="overflow-x-auto">
// //             <table className="min-w-full divide-y divide-gray-200">
// //               <thead className="bg-gray-50">
// //                 <tr>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Name
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Email
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Role
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Contact
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Status
// //                   </th>
// //                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Actions
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody className="bg-white divide-y divide-gray-200">
// //                 {filteredUsers?.map((user) => (
// //                   <tr key={user._id} className="hover:bg-gray-50">
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="flex items-center">
// //                         <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
// //                           <span className="text-indigo-800 font-medium">
// //                             {user.firstName[0]}
// //                             {user.lastName[0]}
// //                           </span>
// //                         </div>
// //                         <div className="ml-4">
// //                           <div className="text-sm font-medium text-gray-900">
// //                             {user.firstName} {user.lastName}
// //                           </div>
// //                           <div className="text-sm text-gray-500">ID: {user._id.substring(0, 8)}...</div>
// //                         </div>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="text-sm text-gray-900">{user.email}</div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
// //                         {roleLabels[user.role]}
// //                       </span>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
// //                         {user.isActive ? "Active" : "Inactive"}
// //                       </span>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
// //                       <button
// //                         onClick={() => setEditingUser(user)}
// //                         className="text-indigo-600 hover:text-indigo-900 mr-4"
// //                       >
// //                         <PencilSquareIcon className="h-5 w-5" />
// //                         <span className="sr-only">Edit</span>
// //                       </button>
// //                       <button
// //                         onClick={() => handleDelete(user._id)}
// //                         className="text-red-600 hover:text-red-900"
// //                         disabled={user.role === "admin" && filteredUsers.filter((u) => u.role === "admin").length === 1}
// //                       >
// //                         <TrashIcon className="h-5 w-5" />
// //                         <span className="sr-only">Delete</span>
// //                       </button>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         )}
// //       </div>

// //       {/* Pagination - can be implemented if needed */}
// //       <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
// //         <div className="flex-1 flex justify-between sm:hidden">
// //           <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
// //             Previous
// //           </button>
// //           <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
// //             Next
// //           </button>
// //         </div>
// //         <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
// //           <div>
// //             <p className="text-sm text-gray-700">
// //               Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers?.length || 0}</span> of <span className="font-medium">{filteredUsers?.length || 0}</span> results
// //             </p>
// //           </div>
// //           <div>
// //             <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
// //               <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
// //                 <span className="sr-only">Previous</span>
// //                 <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
// //                   <path
// //                     fillRule="evenodd"
// //                     d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
// //                     clipRule="evenodd"
// //                   />
// //                 </svg>
// //               </button>
// //               <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
// //                 1
// //               </button>
// //               <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
// //                 <span className="sr-only">Next</span>
// //                 <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
// //                   <path
// //                     fillRule="evenodd"
// //                     d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
// //                     clipRule="evenodd"
// //                   />
// //                 </svg>
// //               </button>
// //             </nav>
// //           </div>
// //         </div>
// //       </div>

// //       {editingUser && (
// //         <EditUserModal
// //           user={editingUser}
// //           onClose={() => setEditingUser(null)}
// //           onUpdate={() => setEditingUser(null)}
// //         />
// //       )}
// //     </div>
// //   );
// // };

// // export default UsersList;

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { UserPlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
// import { toast } from "react-toastify";
// import authAPI from "@/APi/auth";
// import api from "@/APi";

// // Modal for editing a user
// const EditUserModal = ({ user, onClose, onUpdate }) => {
//   const [formData, setFormData] = useState({
//     firstName: user.firstName,
//     lastName: user.lastName,
//     email: user.email,
//     phone: user.phone || "",
//     role: user.role,
//     isActive: user.isActive,
//   });
//   const queryClient = useQueryClient();

//   const updateMutation = useMutation({
//     mutationFn: (updatedData) => api.put(`/users/${user._id}`, updatedData),
//     onSuccess: () => {
//       toast.success("User updated successfully");
//       queryClient.invalidateQueries({ queryKey: ["users"] });
//       onUpdate();
//     },
//     onError: (error) => {
//       toast.error(error.message || "Failed to update user");
//     },
//   });

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     updateMutation.mutate(formData);
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50">
//       {/* Modal overlay */}
//       <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
//       {/* Modal content */}
//       <div className="bg-white rounded-lg p-6 z-10 w-1/3">
//         <h2 className="text-xl font-bold mb-4">Edit User</h2>
//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700">First Name</label>
//             <input
//               type="text"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700">Last Name</label>
//             <input
//               type="text"
//               name="lastName"
//               value={formData.lastName}
//               onChange={handleChange}
//               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700">Email</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700">Phone</label>
//             <input
//               type="text"
//               name="phone"
//               value={formData.phone}
//               onChange={handleChange}
//               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700">Role</label>
//             <select
//               name="role"
//               value={formData.role}
//               onChange={handleChange}
//               className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//               required
//             >
//               <option value="admin">Administrator</option>
//               <option value="consultant">Consultant</option>
//               <option value="contractor">Contractor</option>
//               <option value="project_manager">Project Manager</option>
//               <option value="committee">Committee Member</option>
//             </select>
//           </div>
//           <div className="mb-4 flex items-center">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={handleChange}
//               className="mr-2"
//             />
//             <label className="text-sm font-medium text-gray-700">Active</label>
//           </div>
//           <div className="flex justify-end">
//             <button type="button" onClick={onClose} className="mr-4 px-4 py-2 bg-gray-300 text-gray-800 rounded">
//               Cancel
//             </button>
//             <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
//               Update User
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // Modal for viewing user details
// const UserDetailModal = ({ user, onClose }) => {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50">
//       {/* Modal overlay */}
//       <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
//       {/* Modal content */}
//       <div className="bg-white rounded-lg p-6 z-10 w-1/3">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">User Details</h2>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//             {/* X icon */}
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>
//         <div className="space-y-3">
//           <div>
//             <span className="font-semibold">Name:</span> {user.firstName} {user.lastName}
//           </div>
//           <div>
//             <span className="font-semibold">Email:</span> {user.email}
//           </div>
//           <div>
//             <span className="font-semibold">Role:</span> {user.role}
//           </div>
//           <div>
//             <span className="font-semibold">Phone:</span> {user.phone || "N/A"}
//           </div>
//           <div>
//             <span className="font-semibold">Status:</span> {user.isActive ? "Active" : "Inactive"}
//           </div>
//           <div>
//             <span className="font-semibold">Assigned Projects:</span>{" "}
//             {user.associatedProjects && user.associatedProjects.length > 0 ? (
//               <ul className="list-disc pl-5">
//                 {user.associatedProjects.map((proj, idx) => (
//                   <li key={idx}>{proj.name || proj}</li>
//                 ))}
//               </ul>
//             ) : (
//               "None"
//             )}
//           </div>
//         </div>
//         <div className="mt-6 flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const UsersList = () => {
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [editingUser, setEditingUser] = useState(null);
//   const [viewingUser, setViewingUser] = useState(null);

//   // Fetch users from the new user endpoint
//   const { data, isLoading, error } = useQuery({
//     queryKey: ["users"],
//     queryFn: async () => {
//       const response = await api.get("/users");
//       return response.data.data; // Expecting an array of users
//     },
//     enabled: authAPI.isAdmin(),
//   });

//   // Delete user mutation
//   const deleteMutation = useMutation({
//     mutationFn: (userId) => api.delete(`/users/${userId}`),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["users"] });
//       toast.success("User deleted successfully");
//     },
//     onError: (error) => {
//       toast.error(error.message || "Failed to delete user");
//     },
//   });

//   // Handle deletion
//   const handleDelete = (userId) => {
//     if (window.confirm("Are you sure you want to delete this user?")) {
//       deleteMutation.mutate(userId);
//     }
//   };

//   // Filter users based on search term
//   const filteredUsers = data?.filter((user) => {
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       user.firstName.toLowerCase().includes(searchLower) ||
//       user.lastName.toLowerCase().includes(searchLower) ||
//       user.email.toLowerCase().includes(searchLower) ||
//       user.role.toLowerCase().includes(searchLower)
//     );
//   });

//   // Redirect if current user is not an admin
//   if (!authAPI.isAdmin()) {
//     navigate("/dashboard");
//     return null;
//   }

//   // Role color mapping
//   const roleColors = {
//     admin: "bg-purple-100 text-purple-800",
//     consultant: "bg-blue-100 text-blue-800",
//     contractor: "bg-green-100 text-green-800",
//     project_manager: "bg-yellow-100 text-yellow-800",
//     committee: "bg-red-100 text-red-800",
//   };

//   // Role label mapping
//   const roleLabels = {
//     admin: "Administrator",
//     consultant: "Consultant",
//     contractor: "Contractor",
//     project_manager: "Project Manager",
//     committee: "Committee Member",
//   };

//   return (
//     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
//       <div className="sm:flex sm:items-center sm:justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
//           <p className="text-gray-500 text-sm">
//             Manage users, their roles, and permissions in the WKU Construction Management System.
//           </p>
//         </div>
//         <button
//           type="button"
//           onClick={() => navigate("/admin/users/register")}
//           className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//         >
//           <UserPlusIcon className="h-5 w-5 mr-2" />
//           Add New User
//         </button>
//       </div>

//       {/* Search and filter */}
//       <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
//         <div className="px-4 py-5 sm:p-6">
//           <div className="max-w-lg w-full">
//             <label htmlFor="search" className="sr-only">
//               Search Users
//             </label>
//             <div className="relative">
//               <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
//                 <svg
//                   className="h-5 w-5 text-gray-400"
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 20 20"
//                   fill="currentColor"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               </div>
//               <input
//                 id="search"
//                 name="search"
//                 className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                 placeholder="Search by name, email, or role"
//                 type="search"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Users list */}
//       <div className="bg-white shadow rounded-lg overflow-hidden">
//         {isLoading ? (
//           <div className="text-center py-20">
//             <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
//             <p className="mt-2 text-gray-500">Loading users...</p>
//           </div>
//         ) : error ? (
//           <div className="text-center py-20">
//             <p className="text-red-500">Failed to load users: {error.message}</p>
//             <button
//               onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
//               className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//             >
//               <ArrowPathIcon className="h-5 w-5 mr-2" />
//               Retry
//             </button>
//           </div>
//         ) : filteredUsers?.length === 0 ? (
//           <div className="text-center py-20">
//             <p className="text-gray-500">
//               {searchTerm ? "No users match your search criteria." : "No users found."}
//             </p>
//             {searchTerm && (
//               <button
//                 onClick={() => setSearchTerm("")}
//                 className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               >
//                 Clear Search
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Name
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Email
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Role
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Contact
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredUsers.map((user) => (
//                   <tr key={user._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewingUser(user)}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
//                           <span className="text-indigo-800 font-medium">
//                             {user.firstName[0]}
//                             {user.lastName[0]}
//                           </span>
//                         </div>
//                         <div className="ml-4">
//                           <div className="text-sm font-medium text-gray-900">
//                             {user.firstName} {user.lastName}
//                           </div>
//                           <div className="text-sm text-gray-500">ID: {user._id.substring(0, 8)}...</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-900">{user.email}</div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
//                         {roleLabels[user.role]}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
//                         {user.isActive ? "Active" : "Inactive"}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                       <button
//                         onClick={(e) => { e.stopPropagation(); setEditingUser(user); }}
//                         className="text-indigo-600 hover:text-indigo-900 mr-4"
//                       >
//                         <PencilSquareIcon className="h-5 w-5" />
//                         <span className="sr-only">Edit</span>
//                       </button>
//                       <button
//                         onClick={(e) => { e.stopPropagation(); handleDelete(user._id); }}
//                         className="text-red-600 hover:text-red-900"
//                         disabled={user.role === "admin" && filteredUsers.filter((u) => u.role === "admin").length === 1}
//                       >
//                         <TrashIcon className="h-5 w-5" />
//                         <span className="sr-only">Delete</span>
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Pagination (if needed) */}
//       <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
//         <div className="flex-1 flex justify-between sm:hidden">
//           <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//             Previous
//           </button>
//           <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//             Next
//           </button>
//         </div>
//         <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//           <div>
//             <p className="text-sm text-gray-700">
//               Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers?.length || 0}</span> of <span className="font-medium">{filteredUsers?.length || 0}</span> results
//             </p>
//           </div>
//           <div>
//             <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
//               <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
//                 <span className="sr-only">Previous</span>
//                 <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
//                   <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
//                 </svg>
//               </button>
//               <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
//                 1
//               </button>
//               <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
//                 <span className="sr-only">Next</span>
//                 <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
//                   <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//                 </svg>
//               </button>
//             </nav>
//           </div>
//         </div>
//       </div>

//       {editingUser && (
//         <EditUserModal
//           user={editingUser}
//           onClose={() => setEditingUser(null)}
//           onUpdate={() => setEditingUser(null)}
//         />
//       )}

//       {viewingUser && (
//         <UserDetailModal
//           user={viewingUser}
//           onClose={() => setViewingUser(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default UsersList;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import authAPI from "@/APi/auth";
import api from "@/APi";

const EditUserModal = ({ user, onClose, onUpdate }) => {
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
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
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
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 z-10 w-1/2">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            >
              <option value="admin">Administrator</option>
              <option value="consultant">Consultant</option>
              <option value="contractor">Contractor</option>
              <option value="project_manager">Project Manager</option>
              <option value="committee">Committee Member</option>
            </select>
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-4 px-4 py-2 bg-gray-300 text-gray-800 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserDetailModal = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 z-10 w-1/2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">User Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <span className="font-semibold">Name:</span> {user.firstName} {user.lastName}
          </div>
          <div>
            <span className="font-semibold">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-semibold">Role:</span> {user.role}
          </div>
          <div>
            <span className="font-semibold">Phone:</span> {user.phone || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Status:</span> {user.isActive ? "Active" : "Inactive"}
          </div>
          <div>
            <span className="font-semibold">Assigned Projects:</span>{" "}
            {/* Use associatedProjects from your model */}
            {user.associatedProjects && user.associatedProjects.length > 0 ? (
              <ul className="list-disc pl-5">
                {user.associatedProjects.map((proj) => (
                  // Assuming the project model has a field named projectName
                  <li key={proj._id}>{proj.projectName || proj}</li>
                ))}
              </ul>
            ) : (
              "None"
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const UsersList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data.data;
    },
    enabled: authAPI.isAdmin(),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const handleDelete = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(userId);
    }
  };

  const filteredUsers = data?.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  if (!authAPI.isAdmin()) {
    navigate("/dashboard");
    return null;
  }

  const roleColors = {
    admin: "bg-purple-100 text-purple-800",
    consultant: "bg-blue-100 text-blue-800",
    contractor: "bg-green-100 text-green-800",
    project_manager: "bg-yellow-100 text-yellow-800",
    committee: "bg-red-100 text-red-800",
  };

  const roleLabels = {
    admin: "Administrator",
    consultant: "Consultant",
    contractor: "Contractor",
    project_manager: "Project Manager",
    committee: "Committee Member",
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
          <p className="text-gray-500 text-sm">
            Manage users, their roles, and permissions in the WKU Construction Management System.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/users/register")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add New User
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="max-w-lg w-full">
            <label htmlFor="search" className="sr-only">
              Search Users
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by name, email, or role"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20">
            <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">Failed to load users: {error.message}</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        ) : filteredUsers?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">
              {searchTerm ? "No users match your search criteria." : "No users found."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewingUser(user)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-800 font-medium">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">ID: {user._id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUser(user);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(user._id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        disabled={user.role === "admin" && filteredUsers.filter((u) => u.role === "admin").length === 1}
                      >
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

      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
        <div className="flex-1 flex justify-between sm:hidden">
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
          <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers?.length || 0}</span> of <span className="font-medium">{filteredUsers?.length || 0}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                1
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onUpdate={() => setEditingUser(null)} />
      )}

      {viewingUser && (
        <UserDetailModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  );
};

export default UsersList;
