import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { HealthReportUpload } from "../components/HealthReportUpload";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Calendar, Video, FileText, User, Activity, Clock, Bell, Plus,
  ChevronRight, Stethoscope, Shield, Star, LogOut, Edit2,
  CheckCircle, AlertCircle, Loader2, Download, Eye
} from "lucide-react";

interface Consultation {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: string;
  meetingLink: string;
}

interface HealthReport {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  notes: string;
  status: string;
  uploadedAt: string;
}

export function UserDashboard() {
  const { user, logout, apiCall } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth", { replace: true }); return; }
    if (user.role === "doctor") { navigate("/doctor/dashboard", { replace: true }); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [consultRes, reportRes] = await Promise.all([
        apiCall("/consultations/my"),
        apiCall("/reports/legacy-my"),
      ]);
      const consultData = await consultRes.json();
      const reportData = await reportRes.json();
      setConsultations(consultData.consultations || []);
      setReports(reportData.reports || []);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return dateStr; }
  };

  const TABS = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "consultations", label: "Consultations", icon: Video },
    { id: "reports", label: "Health Reports", icon: FileText },
    { id: "upload", label: "Upload Report", icon: Plus },
    { id: "profile", label: "Profile", icon: User },
  ];

  if (!user) return null;

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sky-200 text-sm">Welcome back,</p>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>{user.name}</h1>
                <p className="text-sky-200 text-sm capitalize">{user.role} Account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/consultation")}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Video className="w-4 h-4" /> Book Consultation
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium transition-all border-b border-slate-50 last:border-0 ${
                    activeTab === id
                      ? "bg-sky-50 text-sky-700 border-l-4 border-l-sky-500"
                      : "text-slate-600 hover:bg-slate-50 hover:text-sky-600"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {loading && activeTab !== "upload" ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { icon: Video, label: "Consultations", value: consultations.length, color: "from-sky-500 to-blue-600", bg: "bg-sky-50" },
                        { icon: FileText, label: "Health Reports", value: reports.length, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
                        { icon: CheckCircle, label: "Completed", value: consultations.filter((c) => c.status === "confirmed").length, color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
                        { icon: Shield, label: "Health Score", value: "Good", color: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
                      ].map(({ icon: Icon, label, value, color, bg }) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                        >
                          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
                          <p className="text-slate-500 text-xs mt-1">{label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <h2 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Quick Actions</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { icon: Video, label: "Book Consultation", action: () => navigate("/consultation"), color: "bg-sky-500" },
                          { icon: FileText, label: "Upload Report", action: () => setActiveTab("upload"), color: "bg-emerald-500" },
                          { icon: User, label: "Edit Profile", action: () => setActiveTab("profile"), color: "bg-violet-500" },
                          { icon: Star, label: "Give Feedback", action: () => navigate("/contact?subject=feedback"), color: "bg-fuchsia-500" },
                          { icon: Activity, label: "AI Health Chat", action: () => {}, color: "bg-amber-500" },
                        ].map(({ icon: Icon, label, action, color }) => (
                          <button
                            key={label}
                            onClick={action}
                            className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-sky-50 rounded-2xl border border-slate-200 hover:border-sky-200 transition-all"
                          >
                            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-slate-700 text-center">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Consultations */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>Recent Consultations</h2>
                        <button onClick={() => setActiveTab("consultations")} className="text-sky-600 text-sm flex items-center gap-1">
                          View all <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      {consultations.length === 0 ? (
                        <div className="text-center py-8">
                          <Video className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-500 text-sm">No consultations yet</p>
                          <button onClick={() => navigate("/consultation")} className="mt-3 text-sky-600 text-sm font-medium hover:underline">
                            Book your first consultation
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {consultations.slice(0, 3).map((c) => (
                            <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                                <Stethoscope className="w-5 h-5 text-sky-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-sm">{c.doctorName}</p>
                                <p className="text-slate-500 text-xs">{c.specialty} · {c.date} {c.time}</p>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                c.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                              }`}>
                                {c.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Consultations Tab */}
                {activeTab === "consultations" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>My Consultations</h2>
                      <button
                        onClick={() => navigate("/consultation")}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Book New
                      </button>
                    </div>
                    {consultations.length === 0 ? (
                      <div className="text-center py-16">
                        <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500">No consultations scheduled</p>
                        <button onClick={() => navigate("/consultation")} className="mt-4 px-6 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700">
                          Find Doctors
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {consultations.map((c) => (
                          <div key={c.id} className="p-4 border border-slate-200 rounded-2xl hover:border-sky-200 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                  <Video className="w-6 h-6 text-sky-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{c.doctorName}</p>
                                  <p className="text-sky-600 text-sm">{c.specialty}</p>
                                  <p className="text-slate-500 text-xs mt-1">
                                    {c.date} at {c.time} · {c.type} consultation
                                  </p>
                                </div>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${
                                c.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                              }`}>
                                {c.status}
                              </span>
                            </div>
                            {c.meetingLink && (
                              <div className="mt-3 p-2 bg-sky-50 border border-sky-100 rounded-lg">
                                <a href={c.meetingLink} target="_blank" className="text-xs text-sky-600 font-medium hover:underline flex items-center gap-1">
                                  <Video className="w-3.5 h-3.5" /> Join Meeting: {c.meetingLink}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reports Tab */}
                {activeTab === "reports" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>My Health Reports</h2>
                      <button
                        onClick={() => setActiveTab("upload")}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Upload Report
                      </button>
                    </div>
                    {reports.length === 0 ? (
                      <div className="text-center py-16">
                        <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500">No health reports uploaded yet</p>
                        <button onClick={() => setActiveTab("upload")} className="mt-4 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">
                          Upload First Report
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {reports.map((r) => (
                          <div key={r.id} className="p-4 border border-slate-200 rounded-2xl hover:border-emerald-200 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-sm truncate">{r.fileName}</p>
                                <p className="text-slate-500 text-xs">{r.category} · {formatSize(r.fileSize)}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-xs text-slate-500">{formatDate(r.uploadedAt)}</span>
                              </div>
                              <div className="flex gap-2">
                                <button className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-sky-100 transition-colors">
                                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                                <button className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors">
                                  <Download className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Tab */}
                {activeTab === "upload" && (
                  <div>
                    <HealthReportUpload />
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>My Profile</h2>
                      <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50">
                        <Edit2 className="w-4 h-4" /> Edit Profile
                      </button>
                    </div>
                    <div className="flex items-center gap-5 mb-8 p-5 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border border-sky-100">
                      <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>{user.name}</h3>
                        <p className="text-sky-600 capitalize">{user.role}</p>
                        <p className="text-slate-500 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", value: user.name },
                        { label: "Email Address", value: user.email },
                        { label: "Phone Number", value: user.phone || "Not provided" },
                        { label: "Account Type", value: user.role, capitalize: true },
                        { label: "Member Since", value: formatDate(user.createdAt) },
                        { label: "Account Status", value: "Active ✅" },
                      ].map(({ label, value, capitalize }) => (
                        <div key={label} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                          <p className={`font-semibold text-slate-900 ${capitalize ? "capitalize" : ""}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
