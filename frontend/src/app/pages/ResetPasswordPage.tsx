import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    const { error } = await resetPassword(token, password);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Password reset successful. Please sign in.");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Reset Password</h1>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="New password" className="w-full border border-slate-300 rounded-xl px-3 py-2" />
        <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required placeholder="Confirm new password" className="w-full border border-slate-300 rounded-xl px-3 py-2" />
        <button disabled={loading} className="w-full bg-sky-600 text-white py-2 rounded-xl disabled:opacity-60">
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
