"use client"

import { useState } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
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
} from "@heroicons/react/24/outline"
import authAPI from "../../api/auth"

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const currentUser = authAPI.getCurrentUser()

  if (!authAPI.isAuthenticated()) {
    navigate("/login")
    return null
  }

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const userRole = currentUser?.role
    const commonItems = [
      { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
      { name: "Profile", href: "/profile", icon: UserIcon },
    ]

    // Role-specific navigation items
    const roleItems = {
      admin: [{ name: "Admin Console", href: "/admin", icon: ChartBarIcon }],
      consultant: [
        { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
        { name: "Reports", href: "/reports", icon: DocumentTextIcon },
      ],
      contractor: [
        { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
        { name: "Materials", href: "/materials", icon: CubeIcon },
        { name: "Schedules", href: "/schedules", icon: ClipboardDocumentListIcon },
      ],
      project_manager: [
        { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
        { name: "Reports", href: "/reports", icon: DocumentTextIcon },
        { name: "Schedules", href: "/schedules", icon: ClipboardDocumentListIcon },
        { name: "Materials", href: "/materials", icon: CubeIcon },
      ],
      committee: [
        { name: "Projects", href: "/projects", icon: BuildingOfficeIcon },
        { name: "Reports", href: "/reports", icon: DocumentTextIcon },
      ],
    }

    return [...commonItems, ...(userRole ? roleItems[userRole] || [] : [])]
  }

  const navigationItems = getNavigationItems()

  const handleLogout = () => {
    authAPI.logout()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? "" : "hidden"}`} role="dialog">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" />
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
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-4 h-6 w-6 text-indigo-600" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button className="flex-shrink-0 group block w-full" onClick={handleLogout}>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-800 font-medium">
                    {currentUser?.firstName?.[0]}
                    {currentUser?.lastName?.[0]}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </p>
                  <div className="flex items-center text-sm font-medium text-red-500 group-hover:text-red-700">
                    <ArrowRightOnRectangleIcon className="mr-1 h-5 w-5" />
                    Logout
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
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
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <item.icon className="mr-3 h-6 w-6 text-indigo-600" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button className="flex-shrink-0 w-full group block" onClick={handleLogout}>
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
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout

