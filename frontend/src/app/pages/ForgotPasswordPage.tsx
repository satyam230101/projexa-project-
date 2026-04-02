import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function ForgotPasswordPage() {
  const { startForgotPassword, verifyForgotPasswordOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, message } = await startForgotPassword(email);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success(message || "OTP sent");
    setStep("otp");
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, resetToken } = await verifyForgotPasswordOtp(email, otp);
    setLoading(false);
    if (error || !resetToken) return toast.error(error || "Failed to verify OTP");
    navigate(`/auth/reset-password?token=${encodeURIComponent(resetToken)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={step === "email" ? sendOtp : verifyOtp} className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Forgot Password</h1>
        {step === "email" ? (
          <>
            <p className="text-sm text-slate-600">Enter your account email to receive OTP.</p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="w-full border border-slate-300 rounded-xl px-3 py-2" />
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">Enter OTP sent to <b>{email}</b>.</p>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="Enter OTP" className="w-full border border-slate-300 rounded-xl px-3 py-2" />
          </>
        )}
        <button disabled={loading} className="w-full bg-sky-600 text-white py-2 rounded-xl disabled:opacity-60">
          {loading ? "Please wait..." : step === "email" ? "Send OTP" : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
