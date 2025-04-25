import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Add this import
import authAPI from "@/APi/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Add this line
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const requestOTPMutation = useMutation({
    mutationFn: authAPI.forgotPassword,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("OTP sent to your email");
        setStep("otp");
      } else {
        setError(data.message || "Failed to send OTP");
      }
    },
    onError: (error) => {
      setError(error.response?.data?.message || "Failed to send OTP");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => authAPI.verifyOTPAndResetPassword(email, otp, newPassword),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Password reset successful");
        navigate("/login");
      } else {
        setError(data.message || "Failed to reset password");
      }
    },
    onError: (error) => {
      setError(error.response?.data?.message || "Failed to reset password");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (step === "email") {
      requestOTPMutation.mutate(email);
    } else if (step === "otp") {
      if (!otp) {
        setError("Please enter the OTP");
        return;
      }
      setStep("newPassword");
    } else {
      if (!newPassword) {
        setError("Please enter a new password");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      resetPasswordMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="w-full py-4 px-8 border-b border-gray-300 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-indigo-600">Reset Password</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg p-8 border border-gray-300 shadow-xl bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {step === "email" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            )}

            {step === "otp" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            )}

            {step === "newPassword" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {step === "email" && (requestOTPMutation.isPending ? "Sending..." : "Send OTP")}
              {step === "otp" && "Verify OTP"}
              {step === "newPassword" && (resetPasswordMutation.isPending ? "Resetting..." : "Reset Password")}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-700"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;