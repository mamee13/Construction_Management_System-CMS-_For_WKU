"use client"

// src/components/auth/LoginForm.jsx
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import authAPI from "@/APi/auth" // Ensure this path is correct

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: (credentials) => authAPI.login(credentials),
    onSuccess: (data) => {
      if (data.success) {
        console.log("Login successful via API.")
        navigate("/")
      } else {
        console.error("Login API reported success false or missing data:", data)
        setError(data.message || "Login failed: Invalid response from server.")
      }
    },
    onError: (error) => {
      console.error("Login mutation error:", error)
      let errorMessage = "Login failed. Please check your credentials and try again."
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      setError(errorMessage)
    },
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")
    console.log("Submitting login form:", formData.email)
    loginMutation.mutate(formData)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Title spanning full width */}
      <div
        className="w-full py-4 px-8 border-b border-gray-300 shadow-sm text-center flex items-center justify-center"
        style={{ backgroundColor: "#e2e8f0" }}
      >
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled-oFKudtjOWptydyMVCJyO5cl00r8KSb.png"
          alt="Wolkite University Logo"
          className="h-16 mr-4"
        />
        <h1 className="text-3xl font-bold text-indigo-600">Wolkite University Construction Management System (CMS)</h1>
      </div>

      {/* Background image container with reduced blur effect */}
      <div
        className="flex flex-1 relative"
        style={{
          position: "relative",
        }}
      >
        {/* Blurred background image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wolkite.jpg-2XtAAWZKjdgLae2rOY72wkWIIfXh4B.jpeg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(1px)", // Reduced blur
            opacity: 0.8, // Slightly increased opacity
          }}
        ></div>

        {/* Left side - Welcome Text */}
        <div className="hidden md:flex md:w-3/5 items-center justify-center p-8 relative z-10">
          <div
            className="max-w-2xl px-8 py-6 rounded-lg shadow-md"
            style={{ backgroundColor: "#e2e8f0", opacity: 0.9 }} // Matching titlebar background
          >
            <div className="space-y-6">
              <p className="text-xl font-medium text-gray-700">
                Welcome to the Wolkite University Construction Management System (CMS)
              </p>

              <p className="text-gray-600 text-sm leading-relaxed">
                The Wolkite University Construction Management System is a dedicated platform developed to support the
                efficient planning, coordination, and oversight of construction projects within the university. This
                system is part of the institution's broader commitment to infrastructure development, operational
                transparency, and sustainable growth.
              </p>

              <p className="text-gray-600 text-sm leading-relaxed">
                The CMS enables users to manage various aspects of construction projects, including project planning and
                scheduling, progress tracking, budget management, document handling, and the generation of periodic
                reports. Through this system, the university aims to strengthen communication among departments, ensure
                accountability, and facilitate the timely and cost-effective delivery of construction initiatives.
              </p>

              <p className="font-medium text-indigo-600">
                Thank you for using the CMS — a step toward structured, reliable, and future-focused development at
                Wolkite University.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full md:w-2/5 flex items-center justify-center p-6 relative z-10">
          <div
            className="w-full max-w-md rounded-lg p-8 border border-gray-300 shadow-xl"
            style={{ backgroundColor: "#e2e8f0", opacity: 0.9 }} // Matching titlebar background
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-indigo-600">Wolkite University CMS</h2>
              <p className="text-sm text-gray-600 mt-2">Sign in to access the Construction Management System</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                    aria-describedby={error ? "error-message" : undefined}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                    aria-describedby={error ? "error-message" : undefined}
                  />
                </div>
              </div>

              {error && (
                <p id="error-message" className="sr-only">
                  {error}
                </p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className={`flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                    loginMutation.isPending ? "bg-indigo-400" : "bg-indigo-600"
                  }`}
                >
                  {loginMutation.isPending ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
