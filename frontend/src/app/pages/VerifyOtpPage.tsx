import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function VerifyOtpPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifySignupOtp } = useAuth();
  const email = useMemo(() => params.get("email") || "", [params]);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await verifySignupOtp(email, otp);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Email verified successfully");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Verify Your Email</h1>
        <p className="text-sm text-slate-600">Enter the OTP sent to <b>{email}</b>.</p>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit OTP"
          className="w-full border border-slate-300 rounded-xl px-3 py-2"
          required
        />
        <button disabled={loading} className="w-full bg-sky-600 text-white py-2 rounded-xl disabled:opacity-60">
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
