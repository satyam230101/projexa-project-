import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, User, Mail, Lock, Phone, Stethoscope, UserCheck,
  Shield, ArrowLeft, Loader2, CheckCircle, ChevronRight, Heart
} from "lucide-react";

const SPECIALTIES = [
  "General Medicine", "Cardiology", "Pediatrics", "Dermatology", "Neurology",
  "Orthopedics", "Gynecology", "Psychiatry", "Endocrinology", "Ophthalmology",
  "ENT", "Urology", "Nephrology", "Pulmonology", "Gastroenterology", "Oncology",
];

type Role = "patient" | "doctor" | "user";
type Mode = "login" | "register";

const ROLE_INFO = {
  patient: {
    icon: User,
    label: "Patient",
    desc: "Book consultations & manage health",
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
    border: "border-sky-300",
    text: "text-sky-700",
  },
  doctor: {
    icon: Stethoscope,
    label: "Doctor",
    desc: "Join our network of specialists",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
  },
  user: {
    icon: UserCheck,
    label: "General User",
    desc: "Access health information & AI chat",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-300",
    text: "text-violet-700",
  },
};

function InputField({
  icon: Icon, label, type = "text", field, placeholder, required = true,
  value, onChange, showPassword, onTogglePassword,
}: {
  icon: React.ElementType; label: string; type?: string; field: string;
  placeholder: string; required?: boolean; value: string;
  onChange: (field: string, value: string) => void;
  showPassword?: boolean; onTogglePassword?: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon className="w-4 h-4" />
        </div>
        <input
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-slate-50/50 transition-all"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const initialMode = (searchParams.get("mode") as Mode) || "login";
  const initialRole = (searchParams.get("role") as Role) || "patient";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "", name: "", phone: "",
    specialty: "", qualifications: "", experience: "", bio: "",
  });

  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "doctor") navigate("/doctor/dashboard");
      else navigate("/dashboard");
    }
  }, [user]);

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await login(formData.email, formData.password);
      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }
      toast.success("Welcome back to Medi+!");
    } else {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        setLoading(false);
        return;
      }

      const { error, message } = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: selectedRole,
        phone: formData.phone,
        specialty: formData.specialty,
        qualifications: formData.qualifications,
        experience: formData.experience,
        bio: formData.bio,
      });

      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }

      toast.success(message || "OTP sent to your email. Please verify to activate your account.");
      setLoading(false);
      navigate(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-indigo-700 to-violet-800"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-cyan-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                <path d="M14 10H18V14H22V18H18V22H14V18H10V14H14V10Z" fill="white"/>
                <circle cx="23" cy="9" r="3" fill="#34d399"/>
              </svg>
            </div>
            <div>
              <span className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Medi<span className="text-sky-300">+</span>
              </span>
              <p className="text-sky-200 text-xs">AI Healthcare Platform</p>
            </div>
          </Link>

          <div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              {mode === "login" ? "Welcome Back!" : "Join Medi+ Today"}
            </h2>
            <p className="text-sky-200 text-lg mb-8">
              {mode === "login"
                ? "Sign in to access your health dashboard, consultations, and AI health assistant."
                : "Create your account and start your journey to better healthcare."}
            </p>
            <div className="space-y-4">
              {[
                { icon: Shield, text: "HIPAA compliant & secure" },
                { icon: CheckCircle, text: "500+ verified specialists" },
                { icon: Heart, text: "24/7 AI health support" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-sky-300" />
                  </div>
                  <span className="text-sky-100">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sky-300 text-sm">© {new Date().getFullYear()} Medi+ Healthcare. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white overflow-y-auto relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
                  <path d="M14 10H18V14H22V18H18V22H14V18H10V14H14V10Z" fill="white"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                Medi<span className="text-sky-500">+</span>
              </span>
            </Link>
          </div>

          {/* Tab Toggle */}
          <div className="bg-slate-100 rounded-2xl p-1 flex mb-8">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                {mode === "login" ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                {mode === "login"
                  ? "Enter your credentials to continue"
                  : "Fill in the details to get started"}
              </p>

              {/* Role Selection (Register) */}
              {mode === "register" && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-slate-700 mb-3">I am registering as a:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(ROLE_INFO) as Role[]).map((role) => {
                      const { icon: Icon, label, desc, bg, border, text, color } = ROLE_INFO[role];
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          className={`p-3 rounded-2xl border-2 text-center transition-all ${
                            selectedRole === role
                              ? `${bg} ${border}`
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-2`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <p className={`text-xs font-bold ${selectedRole === role ? text : "text-slate-700"}`}>{label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">{desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <InputField icon={User} label="Full Name" field="name" placeholder="John Doe"
                    value={formData.name} onChange={updateForm} />
                )}

                <InputField icon={Mail} label="Email Address" type="email" field="email" placeholder="you@example.com"
                  value={formData.email} onChange={updateForm} />
                <InputField icon={Lock} label="Password" type="password" field="password" placeholder="Min 6 characters"
                  value={formData.password} onChange={updateForm} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />

                {mode === "register" && (
                  <>
                    <InputField icon={Lock} label="Confirm Password" type="password" field="confirmPassword" placeholder="Confirm your password"
                      value={formData.confirmPassword} onChange={updateForm} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
                    <InputField icon={Phone} label="Phone Number" type="tel" field="phone" placeholder="+91 9876543210" required={false}
                      value={formData.phone} onChange={updateForm} />

                    {selectedRole === "doctor" && (
                      <div className="space-y-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Doctor Information</p>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Medical Specialty</label>
                          <select
                            value={formData.specialty}
                            onChange={(e) => updateForm("specialty", e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                            required
                          >
                            <option value="">Select specialty...</option>
                            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Qualifications</label>
                          <input
                            type="text"
                            value={formData.qualifications}
                            onChange={(e) => updateForm("qualifications", e.target.value)}
                            placeholder="MBBS, MD, DM..."
                            className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
                          <input
                            type="text"
                            value={formData.experience}
                            onChange={(e) => updateForm("experience", e.target.value)}
                            placeholder="e.g. 10 years"
                            className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Bio</label>
                          <textarea
                            value={formData.bio}
                            onChange={(e) => updateForm("bio", e.target.value)}
                            placeholder="Brief professional description..."
                            rows={2}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {mode === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300 text-sky-500 focus:ring-sky-400" />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate("/auth/forgot-password")}
                      className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : mode === "login" ? (
                    <><span>Sign In</span> <ChevronRight className="w-5 h-5" /></>
                  ) : (
                    <><span>Create Account</span> <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>

                {/* Demo credentials hint */}
                {mode === "login" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700 font-medium mb-1">🔐 Admin Demo Access:</p>
                    <p className="text-xs text-amber-600">Email: admin@mediplus.com | Password: Admin@123456</p>
                  </div>
                )}
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="text-sky-600 font-semibold hover:text-sky-700"
                >
                  {mode === "login" ? "Sign up free" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
              {mode === "login" && (
                <p className="text-sm text-slate-500 text-center mt-2">
                  Forgot password?{" "}
                  <Link to="/auth/forgot-password" className="font-semibold text-sky-600 hover:text-sky-700">
                    Reset with OTP
                  </Link>
                </p>
              )}
        </div>
      </div>
    </div>
  );
}