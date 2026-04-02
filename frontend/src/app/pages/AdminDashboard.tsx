import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Users, Stethoscope, Video, FileText, Activity, TrendingUp,
  Shield, LogOut, RefreshCw, Loader2, Mail, Calendar,
  BarChart2, PieChart, Bell, User, MessageSquare, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend
} from "recharts";

interface Stats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalConsultations: number;
  totalReports: number;
  pendingContacts: number;
}

interface WeeklyData {
  day: string;
  consultations: number;
  registrations: number;
  reports: number;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  phone?: string;
}

const PIE_COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

export function AdminDashboard() {
  const { user, logout, apiCall } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [consultations, setConsultations] = useState<Record<string, unknown>[]>([]);
  const [contacts, setContacts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (user.role !== "admin") { toast.error("Admin access required"); navigate("/"); return; }
    loadData();
  }, [user]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsRes, usersRes, consultRes, contactRes] = await Promise.all([
        apiCall("/admin/stats"),
        apiCall("/admin/users"),
        apiCall("/admin/consultations"),
        apiCall("/admin/contacts"),
      ]);
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const consultData = await consultRes.json();
      const contactData = await contactRes.json();

      setStats(statsData.stats);
      setWeeklyData(statsData.weeklyData || []);
      setUsers(usersData.users || []);
      setConsultations(consultData.consultations || []);
      setContacts(contactData.contacts || []);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const roleDistribution = [
    { name: "Patients", value: stats?.totalPatients || 0 },
    { name: "Doctors", value: stats?.totalDoctors || 0 },
    { name: "General Users", value: Math.max(0, (stats?.totalUsers || 0) - (stats?.totalPatients || 0) - (stats?.totalDoctors || 0)) },
  ];

  const TABS = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "consultations", label: "Consultations", icon: Video },
    { id: "contacts", label: "Messages", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
  ];

  if (!user) return null;

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-violet-200 text-sm">Administrator Panel</p>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>Medi+ Admin</h1>
                <p className="text-violet-200 text-sm">Full system control & analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors">
                <Bell className="w-5 h-5" />
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
                      ? "bg-violet-50 text-violet-700 border-l-4 border-l-violet-500"
                      : "text-slate-600 hover:bg-slate-50 hover:text-violet-600"
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

            {/* System Status */}
            <div className="mt-4 bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">System Status</p>
              {[
                { label: "API Server", status: "online" },
                { label: "Database", status: "online" },
                { label: "AI Services", status: "online" },
                { label: "Storage", status: "online" },
              ].map(({ label, status }) => (
                <div key={label} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-600">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${status === "online" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}></div>
                    <span className={`text-xs font-medium ${status === "online" ? "text-emerald-600" : "text-red-600"}`}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { icon: Users, label: "Total Users", value: stats?.totalUsers || 0, color: "from-sky-500 to-blue-600", bg: "bg-sky-50" },
                        { icon: User, label: "Patients", value: stats?.totalPatients || 0, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
                        { icon: Stethoscope, label: "Doctors", value: stats?.totalDoctors || 0, color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
                        { icon: Video, label: "Consultations", value: stats?.totalConsultations || 0, color: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
                        { icon: FileText, label: "Reports", value: stats?.totalReports || 0, color: "from-rose-500 to-pink-600", bg: "bg-rose-50" },
                        { icon: MessageSquare, label: "Messages", value: stats?.pendingContacts || 0, color: "from-cyan-500 to-teal-600", bg: "bg-cyan-50" },
                      ].map(({ icon: Icon, label, value, color, bg }) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center"
                        >
                          <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                            <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <p className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">{label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Weekly Activity Chart */}
                      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Weekly Activity</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={weeklyData} barSize={12}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                            <Tooltip
                              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                            />
                            <Bar dataKey="consultations" name="Consultations" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="registrations" name="Registrations" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="reports" name="Reports" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Role Distribution */}
                      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>User Distribution</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <RePieChart>
                            <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={3}>
                              {roleDistribution.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recent Users */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>Recent Registrations</h3>
                        <button onClick={() => setActiveTab("users")} className="text-violet-600 text-sm flex items-center gap-1">
                          View all <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left">
                              <th className="text-xs font-semibold text-slate-500 pb-3">Name</th>
                              <th className="text-xs font-semibold text-slate-500 pb-3">Email</th>
                              <th className="text-xs font-semibold text-slate-500 pb-3">Role</th>
                              <th className="text-xs font-semibold text-slate-500 pb-3">Joined</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {users.slice(0, 5).map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-xs font-bold">
                                      {(u.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-slate-900">{u.name || "Unknown"}</span>
                                  </div>
                                </td>
                                <td className="py-3 pr-4 text-sm text-slate-600">{u.email}</td>
                                <td className="py-3 pr-4">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                    u.role === "admin" ? "bg-violet-100 text-violet-700" :
                                    u.role === "doctor" ? "bg-emerald-100 text-emerald-700" :
                                    u.role === "patient" ? "bg-sky-100 text-sky-700" :
                                    "bg-slate-100 text-slate-700"
                                  }`}>
                                    {u.role || "user"}
                                  </span>
                                </td>
                                <td className="py-3 text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>All Users ({users.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 rounded-xl">
                            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 rounded-l-xl">User</th>
                            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Email</th>
                            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Role</th>
                            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Phone</th>
                            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 rounded-r-xl">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-xs font-bold">
                                    {(u.name || "U").charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium text-slate-900">{u.name || "Unknown"}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600">{u.email}</td>
                              <td className="py-3 px-4">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                  u.role === "admin" ? "bg-violet-100 text-violet-700" :
                                  u.role === "doctor" ? "bg-emerald-100 text-emerald-700" :
                                  u.role === "patient" ? "bg-sky-100 text-sky-700" :
                                  "bg-slate-100 text-slate-700"
                                }`}>
                                  {u.role || "user"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-500">{u.phone || "—"}</td>
                              <td className="py-3 px-4 text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Consultations Tab */}
                {activeTab === "consultations" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>All Consultations ({consultations.length})</h2>
                    {consultations.length === 0 ? (
                      <div className="text-center py-16">
                        <Video className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500">No consultations recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {consultations.map((c: Record<string, unknown>, i) => (
                          <div key={String(c.id) || i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                              <Video className="w-5 h-5 text-sky-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 text-sm">{String(c.patientName || "Patient")} → {String(c.doctorName || "Doctor")}</p>
                              <p className="text-xs text-slate-500">{String(c.date || "")} · {String(c.time || "")} · {String(c.specialty || "")}</p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              c.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {String(c.status || "pending")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Contacts Tab */}
                {activeTab === "contacts" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>Contact Messages ({contacts.length})</h2>
                    {contacts.length === 0 ? (
                      <div className="text-center py-16">
                        <Mail className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500">No contact messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contacts.map((c: Record<string, unknown>, i) => (
                          <div key={String(c.id) || i} className="p-4 border border-slate-200 rounded-2xl">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="font-bold text-slate-900">{String(c.name || "")}</p>
                                <p className="text-xs text-slate-500">{String(c.email || "")} · {String(c.phone || "")}</p>
                              </div>
                              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                                {String(c.status || "new")}
                              </span>
                            </div>
                            {c.subject && <p className="text-sm font-medium text-slate-700 mb-1">Subject: {String(c.subject)}</p>}
                            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">{String(c.message || "")}</p>
                            <p className="text-xs text-slate-400 mt-2">{formatDate(String(c.createdAt || ""))}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === "analytics" && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>Consultation Trends (7 Days)</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                          <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
                          <Line type="monotone" dataKey="consultations" name="Consultations" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: "#0ea5e9", r: 4 }} />
                          <Line type="monotone" dataKey="registrations" name="New Users" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 4 }} />
                          <Line type="monotone" dataKey="reports" name="Reports" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>User Role Breakdown</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <RePieChart>
                            <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                              {roleDistribution.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Key Metrics</h3>
                        <div className="space-y-4">
                          {[
                            { label: "Avg. Daily Consultations", value: "38", trend: "+12%" },
                            { label: "User Retention Rate", value: "87%", trend: "+3%" },
                            { label: "Doctor Response Rate", value: "96%", trend: "+1%" },
                            { label: "Report Upload Rate", value: "74%", trend: "+8%" },
                          ].map(({ label, value, trend }) => (
                            <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                              <div>
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
                              </div>
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">{trend}</span>
                            </div>
                          ))}
                        </div>
                      </div>
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
