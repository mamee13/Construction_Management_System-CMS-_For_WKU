"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../APi/index"

const LoginDebug = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleDebugLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)
    setError(null)

    try {
      // Direct API call to bypass any potential issues in the authAPI service
      const result = await api.post("/auth/login", { email, password })
      setResponse(result.data)
    } catch (err) {
      console.error("Debug login error:", err)
      setError(err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Login Debugging Tool</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Test login credentials directly against the API</p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleDebugLogin}>
            <div>
              <label htmlFor="debug-email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="debug-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="debug-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="debug-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {loading ? "Testing..." : "Test Login"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="ml-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Login
              </button>
            </div>
          </form>

          {response && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">API Response:</h3>
              <div className="mt-2 bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs">{JSON.stringify(response, null, 2)}</pre>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-red-600">API Error:</h3>
              <div className="mt-2 bg-red-50 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs text-red-800">{JSON.stringify(error, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginDebug

