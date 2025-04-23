

// /* eslint-disable */
// import { useState, useEffect } from "react";
// import { Outlet, NavLink, useNavigate } from "react-router-dom";
// import {
//     Bars3Icon,
//     XMarkIcon,
//     HomeIcon,
//     BuildingOfficeIcon,
//     DocumentTextIcon,
//     ClipboardDocumentListIcon,
//     CubeIcon,
//     ChartBarIcon,         // Keep this for the "Admin Console" link
//     UserIcon,
//     ArrowRightOnRectangleIcon,
//     ClipboardDocumentIcon
// } from "@heroicons/react/24/outline";
// import authAPI from "../../api/auth"; // Adjust path if needed
// import { useNotifications } from "../../hooks/useNotifications"; // Adjust path if needed
// import NotificationBell from "../../components/Notifications/NotificationBell"; // Adjust path if needed

// const MainLayout = () => {
//     const [sidebarOpen, setSidebarOpen] = useState(false);
//     const navigate = useNavigate();
//     const currentUser = authAPI.getCurrentUser();

//     // Use the custom hook for notifications
//     const { notifications, unreadCount, isConnected, markAsRead, clearAll } = useNotifications();

//     // --- CHANGE 1: Modify useEffect ---
//     // Remove the automatic redirect for admin users from this layout.
//     // Only redirect if the user is not authenticated at all.
//     useEffect(() => {
//         if (!authAPI.isAuthenticated()) {
//             console.log("MainLayout: User not authenticated, navigating to login.");
//             navigate("/login");
//         }
//         // The 'if (authAPI.isAdmin()) { navigate("/admin"); }' block has been REMOVED.
//     }, [navigate]); // Dependency array remains [navigate]

//     // --- CHANGE 2: Modify Conditional Return ---
//     // Remove the check that prevents rendering for admins (`|| authAPI.isAdmin()`).
//     // This component should render as long as the user IS authenticated.
//     if (!authAPI.isAuthenticated()) {
//         // Still return null or a loader if not authenticated, waiting for the useEffect redirect.
//         console.log("MainLayout: Not authenticated, rendering null.");
//         return null; // Or return a loading indicator component
//     }
//     // The `|| authAPI.isAdmin()` check is GONE from the condition above.

//     // Define navigation items based on user role
//     const getNavigationItems = () => {
//         const userRole = currentUser?.role;
//         // These items appear for ALL roles using this layout
//         const commonItems = [
//             { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
//             { name: "Profile", href: "/profile", icon: UserIcon },
//         ];

//         // Role-specific items
//         const roleItems = {
//             // --- CHANGE 3: Ensure Admin Console is included HERE ---
//             // This link will navigate the admin TO the AdminLayout when clicked.
//             admin: [
//                 { name: "Admin Console", href: "/admin", icon: ChartBarIcon }
//             ],
//             consultant: [
//                 { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
//                 { name: "Reports", href: "/reports", icon: DocumentTextIcon },
//                 { name: "Schedules", href: "/schedules", icon: ClipboardDocumentListIcon },
//                 { name: "Tasks", href: "/tasks", icon: ClipboardDocumentIcon },
//             ],
//             contractor: [
//                 // Assuming contractors might see projects via MainLayout too. Adjust if needed.
//                 { name: "Projects", href: "/contractor-projects", icon: BuildingOfficeIcon },
//                 { name: "Materials", href: "/materials", icon: CubeIcon },
//                 { name: "Reports", href: "/contractor-reports", icon: DocumentTextIcon },
//             ],
//             project_manager: [
//                 { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
//                 { name: "Reports", href: "/reports", icon: DocumentTextIcon },
//                 { name: "Schedules", href: "/schedules", icon: ClipboardDocumentListIcon },
//                 { name: "Tasks", href: "/tasks", icon: CubeIcon },
//             ],
//             committee: [
//                 { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
//                 { name: "Reports", href: "/reports", icon: DocumentTextIcon },
//             ],
//         };

//         // Combine common items with role-specific items
//         // This line correctly includes the "Admin Console" for admins now.
//         return [...commonItems, ...(userRole ? roleItems[userRole] || [] : [])];
//     };

//     const navigationItems = getNavigationItems();

//     const handleLogout = () => {
//         authAPI.logout();
//         navigate("/login");
//     };

//     // The rest of the component remains the same (JSX for layout)
//     return (
//         <div className="min-h-screen bg-gray-100 relative">
//             {/* Fixed NotificationBell at Top-Right */}
//             <div className="fixed top-4 right-4 z-50">
//                 <NotificationBell
//                     notifications={notifications}
//                     unreadCount={unreadCount}
//                     onMarkRead={markAsRead}
//                     onClearAll={clearAll}
//                 />
//             </div>

//             {/* Mobile Sidebar */}
//             <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? "" : "hidden"}`} role="dialog" aria-modal="true">
//                 {/* Background overlay */}
//                 <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>

//                 {/* Sidebar panel */}
//                 <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
//                     <div className="absolute top-0 right-0 -mr-12 pt-2">
//                         <button
//                             type="button"
//                             className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
//                             onClick={() => setSidebarOpen(false)}
//                         >
//                             <span className="sr-only">Close sidebar</span>
//                             <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
//                         </button>
//                     </div>

//                     <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
//                         <div className="flex-shrink-0 flex items-center px-4">
//                             <h1 className="text-xl font-bold text-indigo-600">WKU-CMS</h1>
//                         </div>
//                         <nav className="mt-5 px-2 space-y-1">
//                             {navigationItems.map((item) => (
//                                 <NavLink
//                                     key={item.name}
//                                     to={item.href}
//                                     end={item.href === '/dashboard'} // Ensure 'Dashboard' isn't active for sub-routes unless it's the exact path
//                                     className={({ isActive }) =>
//                                         `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
//                                             isActive ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
//                                         }`
//                                     }
//                                     onClick={() => setSidebarOpen(false)} // Close sidebar on link click
//                                 >
//                                     <item.icon className="mr-4 flex-shrink-0 h-6 w-6 text-indigo-600" aria-hidden="true" />
//                                     {item.name}
//                                 </NavLink>
//                             ))}
//                         </nav>
//                     </div>
//                     {/* Bottom section (Logout/User Info) */}
//                     <div className="flex-shrink-0 flex items-center justify-between border-t border-gray-200 p-4">
//                         <button className="flex-shrink-0 group block" onClick={handleLogout}>
//                             <div className="flex items-center">
//                                 <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
//                                     <span className="text-indigo-800 font-medium">
//                                         {currentUser?.firstName?.[0]}
//                                         {currentUser?.lastName?.[0]}
//                                     </span>
//                                 </div>
//                                 <div className="ml-3 text-left">
//                                     <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
//                                         {currentUser?.firstName} {currentUser?.lastName}
//                                     </p>
//                                     <div className="flex items-center text-xs font-medium text-red-500 group-hover:text-red-700">
//                                         <ArrowRightOnRectangleIcon className="mr-1 h-4 w-4" />
//                                         Logout
//                                     </div>
//                                 </div>
//                             </div>
//                         </button>
//                     </div>
//                 </div>
//                 <div className="w-14 flex-shrink-0" aria-hidden="true"></div>
//             </div>

//             {/* Static sidebar for desktop */}
//             <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
//                 <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
//                     <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
//                         <div className="flex items-center flex-shrink-0 px-4">
//                             <h1 className="text-xl font-bold text-indigo-600">WKU-CMS</h1>
//                         </div>
//                         <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
//                             {navigationItems.map((item) => (
//                                 <NavLink
//                                     key={item.name}
//                                     to={item.href}
//                                     end={item.href === '/dashboard'} // Ensure 'Dashboard' isn't active for sub-routes unless it's the exact path
//                                     className={({ isActive }) =>
//                                         `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
//                                             isActive ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
//                                         }`
//                                     }
//                                 >
//                                     <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-indigo-600" aria-hidden="true" />
//                                     {item.name}
//                                 </NavLink>
//                             ))}
//                         </nav>
//                     </div>
//                     {/* Desktop bottom section (User Info/Logout) */}
//                     <div className="flex-shrink-0 flex items-center justify-between border-t border-gray-200 p-4">
//                         <button className="flex-shrink-0 group block mr-4 text-left" onClick={handleLogout}>
//                             <div className="flex items-center">
//                                 <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
//                                     <span className="text-indigo-800 font-medium">
//                                         {currentUser?.firstName?.[0]}
//                                         {currentUser?.lastName?.[0]}
//                                     </span>
//                                 </div>
//                                 <div className="ml-3">
//                                     <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
//                                         {currentUser?.firstName} {currentUser?.lastName}
//                                     </p>
//                                     <p className="text-xs text-gray-500">
//                                         {currentUser?.role?.charAt(0).toUpperCase() + currentUser?.role?.slice(1).replace("_", " ")}
//                                     </p>
//                                 </div>
//                             </div>
//                         </button>
//                          {/* Optional: Could put notification bell here too for desktop if preferred over top-right fixed */}
//                     </div>
//                 </div>
//             </div>

//             {/* Main content */}
//             <div className="md:pl-64 flex flex-col flex-1">
//                 {/* Mobile Header Bar */}
//                 <div className="sticky top-0 z-10 md:hidden px-1 pt-1 sm:px-3 sm:pt-3 bg-white shadow flex items-center justify-between">
//                     {/* Mobile Menu Button */}
//                     <button
//                         type="button"
//                         className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
//                         onClick={() => setSidebarOpen(true)}
//                     >
//                         <span className="sr-only">Open sidebar</span>
//                         <Bars3Icon className="h-6 w-6" aria-hidden="true" />
//                     </button>
//                     {/* Title could go here if needed */}
//                      {/* Mobile Notification Bell could also go here if preferred */}
//                 </div>

//                 <main className="flex-1">
//                     <div className="py-6">
//                         <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
//                             {/* Child routes defined in App.js will render here */}
//                             <Outlet />
//                         </div>
//                     </div>
//                 </main>
//             </div>
//         </div>
//     );
// };

// export default MainLayout;

/* eslint-disable */
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
    ChartBarIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    ClipboardDocumentIcon,
    ChatBubbleLeftRightIcon, // <-- Import Chat Icon
} from "@heroicons/react/24/outline";
import authAPI from "../../APi/auth"; // Adjust path if needed
import { useNotifications } from "../../hooks/useNotifications"; // Adjust path if needed
import NotificationBell from "../../components/Notifications/NotificationBell"; // Adjust path if needed

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const currentUser = authAPI.getCurrentUser();
    const { notifications, unreadCount, isConnected, markAsRead, clearAll } = useNotifications();

    useEffect(() => {
        if (!authAPI.isAuthenticated()) {
            console.log("MainLayout: User not authenticated, navigating to login.");
            navigate("/login");
        }
    }, [navigate]);

    if (!authAPI.isAuthenticated()) {
        console.log("MainLayout: Not authenticated, rendering null.");
        return null;
    }

    const getNavigationItems = () => {
        const userRole = currentUser?.role;
        // --- CHANGE: Add Chat to common items ---
        const commonItems = [
            { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon }, // <-- Added Chat Link
            { name: "Profile", href: "/profile", icon: UserIcon },
        ];
        
        const roleItems = {
            admin: [
                { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
                { name: "Admin Console", href: "/admin", icon: ChartBarIcon }
            ],
            consultant: [
                { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
                { name: "Reports", href: "/reports", icon: DocumentTextIcon },
                { name: "Schedules", href: "/schedules", icon: ClipboardDocumentListIcon },
                { name: "Tasks", href: "/tasks", icon: ClipboardDocumentIcon },
            ],
            contractor: [
                { name: "Projects", href: "/contractor-projects", icon: BuildingOfficeIcon },
                { name: "Materials", href: "/materials", icon: CubeIcon },
                { name: "Reports", href: "/contractor-reports", icon: DocumentTextIcon },
            ],
            project_manager: [
                { name: "Projects", href: "/projectmanager-projects", icon: BuildingOfficeIcon },
                { name: "Reports", href: "/projectmanager-reports", icon: DocumentTextIcon },

            ],
            // In the getNavigationItems function, update the committee items:
            committee: [
                { name: "Dashboard", href: "/committee-dashboard", icon: HomeIcon },
                { name: "Projects", href: "/committee-projects", icon: BuildingOfficeIcon },
                { name: "Reports", href: "/committee-reports", icon: DocumentTextIcon },
            ],
            // committee: [
            //     { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
            //     { name: "Reports", href: "/reports", icon: DocumentTextIcon },
            // ],
        };

        return [...commonItems, ...(userRole ? roleItems[userRole] || [] : [])];
    };

    const navigationItems = getNavigationItems();

    const handleLogout = () => {
        authAPI.logout();
        navigate("/login");
    };

    // --- No changes needed in the JSX below this line for chat integration ---
    // ... (rest of the MainLayout component JSX remains the same) ...

    return (
        <div className="min-h-screen bg-gray-100 relative">
            {/* Fixed NotificationBell at Top-Right */}
            <div className="fixed top-4 right-4 z-50">
                <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkRead={markAsRead}
                    onClearAll={clearAll}
                />
            </div>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? "" : "hidden"}`} role="dialog" aria-modal="true">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>

                {/* Sidebar panel */}
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            type="button"
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">Close sidebar</span>
                            <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex-shrink-0 flex items-center px-4">
                            <h1 className="text-xl font-bold text-indigo-600">WKU-CMS</h1>
                        </div>
                        <nav className="mt-5 px-2 space-y-1">
                            {navigationItems.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    // Adjust end prop logic if needed, e.g., for /chat sub-routes later
                                    end={item.href === '/dashboard' || item.href === '/chat'}
                                    className={({ isActive }) =>
                                        `group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`
                                    }
                                    onClick={() => setSidebarOpen(false)} // Close sidebar on link click
                                >
                                    <item.icon className="mr-4 flex-shrink-0 h-6 w-6 text-indigo-600" aria-hidden="true" />
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                    {/* Bottom section (Logout/User Info) */}
                    <div className="flex-shrink-0 flex items-center justify-between border-t border-gray-200 p-4">
                        <button className="flex-shrink-0 group block" onClick={handleLogout}>
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-indigo-800 font-medium">
                                        {currentUser?.firstName?.[0]}
                                        {currentUser?.lastName?.[0]}
                                    </span>
                                </div>
                                <div className="ml-3 text-left">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                        {currentUser?.firstName} {currentUser?.lastName}
                                    </p>
                                    <div className="flex items-center text-xs font-medium text-red-500 group-hover:text-red-700">
                                        <ArrowRightOnRectangleIcon className="mr-1 h-4 w-4" />
                                        Logout
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
                <div className="w-14 flex-shrink-0" aria-hidden="true"></div>
            </div>

            {/* Static sidebar for desktop */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
                    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center flex-shrink-0 px-4">
                            <h1 className="text-xl font-bold text-indigo-600">WKU-CMS</h1>
                        </div>
                        <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                            {navigationItems.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    // Adjust end prop logic if needed
                                    end={item.href === '/dashboard' || item.href === '/chat'}
                                    className={({ isActive }) =>
                                        `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`
                                    }
                                >
                                    <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-indigo-600" aria-hidden="true" />
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                    {/* Desktop bottom section (User Info/Logout) */}
                    <div className="flex-shrink-0 flex items-center justify-between border-t border-gray-200 p-4">
                        <button className="flex-shrink-0 group block mr-4 text-left" onClick={handleLogout}>
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-indigo-800 font-medium">
                                        {currentUser?.firstName?.[0]}
                                        {currentUser?.lastName?.[0]}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                        {currentUser?.firstName} {currentUser?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {currentUser?.role?.charAt(0).toUpperCase() + currentUser?.role?.slice(1).replace("_", " ")}
                                    </p>
                                </div>
                            </div>
                        </button>
                        {/* Optional: Could put notification bell here too for desktop if preferred over top-right fixed */}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="md:pl-64 flex flex-col flex-1">
                {/* Mobile Header Bar */}
                <div className="sticky top-0 z-10 md:hidden px-1 pt-1 sm:px-3 sm:pt-3 bg-white shadow flex items-center justify-between">
                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    {/* Title could go here if needed */}
                    {/* Mobile Notification Bell could also go here if preferred */}
                </div>

                <main className="flex-1">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {/* Child routes defined in App.js will render here */}
                            <Outlet /> {/* The ChatPage will render here when navigated to /chat */}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;