import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar, Video, Users, Star, Clock, Bell, Edit2, LogOut,
  Activity, CheckCircle, Loader2, TrendingUp,
  ChevronRight, User, DollarSign, FileText, Search, Sparkles, Filter,
  Pill, AlertTriangle, ClipboardList, Bot, Send, FlaskConical,
  Wallet, ShieldCheck, CheckSquare, MessageCircle, UsersRound,
  BookOpenCheck, RefreshCw
} from "lucide-react";

interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: string;
  meetingLink: string;
  symptoms: string;
  notes?: string;
  created_at?: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  lastVisit: string;
  totalConsultations: number;
}

interface Report {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: string;
  notes: string;
  analysis?: any;
}

interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface ProductivityTask {
  id: string;
  title: string;
  done: boolean;
}

const TODAY_SCHEDULE = [
  { time: "09:30 AM", patient: "Rahul Verma", type: "Video", status: "confirmed" },
  { time: "11:00 AM", patient: "Priya Singh", type: "Phone", status: "confirmed" },
  { time: "02:30 PM", patient: "Amit Kumar", type: "Video", status: "pending" },
  { time: "04:00 PM", patient: "Sita Devi", type: "Chat", status: "confirmed" },
];

const LAB_TRENDS = [
  { marker: "HbA1c", previous: 8.2, latest: 7.1, unit: "%", target: "< 7.0" },
  { marker: "LDL", previous: 148, latest: 122, unit: "mg/dL", target: "< 100" },
  { marker: "TSH", previous: 6.4, latest: 4.2, unit: "mIU/L", target: "0.4 - 4.0" },
];

const QUICK_RX_PRESETS: PrescriptionItem[] = [
  { medicine: "Paracetamol", dosage: "500 mg", frequency: "TID", duration: "5 days" },
  { medicine: "Pantoprazole", dosage: "40 mg", frequency: "OD", duration: "7 days" },
];

export function DoctorDashboard() {
  const { user, logout, apiCall } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(user?.available ?? false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState<"all" | "past" | "upcoming">("all");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [patientReports, setPatientReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [analyzingReportId, setAnalyzingReportId] = useState<string | null>(null);
  const [soapNote, setSoapNote] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [rxItem, setRxItem] = useState<PrescriptionItem>({ medicine: "", dosage: "", frequency: "", duration: "" });
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState<{ response: string; citations?: any[] } | null>(null);
  const [allergyInput, setAllergyInput] = useState("");
  const [symptomInput, setSymptomInput] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("Medication Reminder");
  const [referralNote, setReferralNote] = useState("");
  const [secondOpinionRequested, setSecondOpinionRequested] = useState(false);
  const [consentCaptured, setConsentCaptured] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(3);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [productivityTasks, setProductivityTasks] = useState<ProductivityTask[]>([
    { id: "t1", title: "Finalize pending prescriptions", done: false },
    { id: "t2", title: "Review high-risk reports", done: false },
    { id: "t3", title: "Call back missed follow-ups", done: false },
    { id: "t4", title: "Complete end-of-day summary", done: false },
  ]);

  useEffect(() => {
    if (!user) { navigate("/auth", { replace: true }); return; }
    if (user.role !== "doctor") { navigate("/dashboard", { replace: true }); return; }
    loadData();
  }, [user]);

  const getConsultationDateTime = (consultation: Consultation) => {
    const datePart = consultation.date || "";
    const timePart = consultation.time || "00:00";
    const parsed = new Date(`${datePart} ${timePart}`);
    return Number.isNaN(parsed.getTime()) ? new Date(datePart) : parsed;
  };

  const newPatientsCount = useMemo(() => {
    const firstSeenByPatient = new Map<string, Date>();
    consultations.forEach((c) => {
      if (!c.patientId) return;
      const current = getConsultationDateTime(c);
      const prev = firstSeenByPatient.get(c.patientId);
      if (!prev || current < prev) {
        firstSeenByPatient.set(c.patientId, current);
      }
    });

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 7);

    let count = 0;
    firstSeenByPatient.forEach((firstVisit) => {
      if (firstVisit >= windowStart) count += 1;
    });
    return count;
  }, [consultations]);

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    const base = [...patients].sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    if (!query) return base;
    return base.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    );
  }, [patients, patientSearch]);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const query = appointmentSearch.trim().toLowerCase();

    return [...consultations]
      .filter((c) => {
        const when = getConsultationDateTime(c);
        if (appointmentFilter === "past") return when < now;
        if (appointmentFilter === "upcoming") return when >= now;
        return true;
      })
      .filter((c) => {
        if (!query) return true;
        return (
          (c.patientName || "").toLowerCase().includes(query) ||
          (c.specialty || "").toLowerCase().includes(query) ||
          (c.status || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => getConsultationDateTime(b).getTime() - getConsultationDateTime(a).getTime());
  }, [consultations, appointmentFilter, appointmentSearch]);

  const upcomingAppointmentsCount = useMemo(
    () => consultations.filter((c) => getConsultationDateTime(c) >= new Date()).length,
    [consultations]
  );

  const pastAppointmentsCount = useMemo(
    () => consultations.filter((c) => getConsultationDateTime(c) < new Date()).length,
    [consultations]
  );

  const noShowRate = useMemo(() => {
    if (!consultations.length) return 0;
    const missed = consultations.filter((c) => ["cancelled", "no_show", "missed"].includes((c.status || "").toLowerCase())).length;
    return Math.round((missed / consultations.length) * 100);
  }, [consultations]);

  const averageDuration = useMemo(() => {
    if (!consultations.length) return 0;
    const total = consultations.reduce((sum, c) => {
      const type = (c.type || "").toLowerCase();
      if (type === "phone") return sum + 16;
      if (type === "chat") return sum + 12;
      return sum + 24;
    }, 0);
    return Math.round(total / consultations.length);
  }, [consultations]);

  const utilization = useMemo(() => {
    const capacity = 12;
    return Math.min(100, Math.round((upcomingAppointmentsCount / capacity) * 100));
  }, [upcomingAppointmentsCount]);

  const overlapAppointments = useMemo(() => {
    const slotMap = new Map<string, Consultation[]>();
    consultations.forEach((c) => {
      const key = `${c.date}|${c.time}`;
      const list = slotMap.get(key) || [];
      list.push(c);
      slotMap.set(key, list);
    });
    const overlaps: Consultation[] = [];
    slotMap.forEach((arr) => {
      if (arr.length > 1) overlaps.push(...arr);
    });
    return overlaps;
  }, [consultations]);

  const followUpQueue = useMemo(() => {
    const perPatient: Record<string, Consultation[]> = {};
    consultations.forEach((c) => {
      if (!c.patientId) return;
      perPatient[c.patientId] = perPatient[c.patientId] || [];
      perPatient[c.patientId].push(c);
    });

    return Object.entries(perPatient)
      .map(([patientId, items]) => {
        const sorted = [...items].sort((a, b) => getConsultationDateTime(b).getTime() - getConsultationDateTime(a).getTime());
        const latest = sorted[0];
        const latestDate = getConsultationDateTime(latest);
        const dueDate = new Date(latestDate);
        dueDate.setDate(dueDate.getDate() + 7);
        const daysToDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const priority = daysToDue < 0 ? "high" : daysToDue <= 2 ? "medium" : "low";
        return {
          patientId,
          patientName: latest.patientName,
          dueDate,
          daysToDue,
          priority,
          lastSymptoms: latest.symptoms || "",
        };
      })
      .sort((a, b) => a.daysToDue - b.daysToDue);
  }, [consultations]);

  const supportAlerts = useMemo(() => {
    const alerts: string[] = [];
    const lowerAllergies = allergyInput.toLowerCase();
    const lowerSymptoms = symptomInput.toLowerCase();
    const lowerMeds = prescriptions.map((p) => p.medicine.toLowerCase());

    if (lowerMeds.some((m) => m.includes("ibuprofen")) && (lowerAllergies.includes("ulcer") || lowerAllergies.includes("kidney"))) {
      alerts.push("Potential NSAID risk: ibuprofen with ulcer/kidney history.");
    }
    if (lowerMeds.some((m) => m.includes("amoxicillin")) && lowerAllergies.includes("penicillin")) {
      alerts.push("Possible penicillin cross-reactivity with amoxicillin.");
    }
    if (lowerSymptoms.includes("chest pain") || lowerSymptoms.includes("breathlessness")) {
      alerts.push("Red-flag symptom detected: consider urgent cardiac/respiratory workup.");
    }
    if (lowerSymptoms.includes("fever") && lowerSymptoms.includes("rash")) {
      alerts.push("Fever with rash: evaluate for infectious and drug-related causes.");
    }

    return alerts;
  }, [allergyInput, symptomInput, prescriptions]);

  const totalRevenueEstimate = useMemo(() => {
    const fee = Number(user?.fee || 500);
    return fee * pastAppointmentsCount;
  }, [user?.fee, pastAppointmentsCount]);

  const logAudit = (entry: string) => {
    const stamp = new Date().toLocaleString("en-IN");
    setAuditLogs((prev) => [`${stamp} - ${entry}`, ...prev].slice(0, 20));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiCall("/consultations/my");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const docs: Consultation[] = data.consultations || [];
      setConsultations(docs);

      // Derive unique patients
      const patientMap: Record<string, Patient> = {};
      docs.forEach((c) => {
        if (!c.patientId) return;
        if (!patientMap[c.patientId]) {
          patientMap[c.patientId] = {
            id: c.patientId,
            name: c.patientName || "Unknown Patient",
            email: c.patientEmail || "No Email",
            lastVisit: c.date,
            totalConsultations: 0
          };
        }
        patientMap[c.patientId].totalConsultations += 1;
        if (new Date(c.date) > new Date(patientMap[c.patientId].lastVisit)) {
          patientMap[c.patientId].lastVisit = c.date;
        }
      });
      setPatients(Object.values(patientMap));
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientReports = async (patientId: string) => {
    setLoadingReports(true);
    try {
      const res = await apiCall(`/reports/patient/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientReports(data.reports || []);
      }
    } catch (err) {
      toast.error("Failed to load patient reports");
    } finally {
      setLoadingReports(false);
    }
  };

  const analyzeReport = async (report: Report) => {
    if (!selectedPatient) return;
    setAnalyzingReportId(report.id);
    try {
      const res = await apiCall(`/reports/${report.id}/analyze`, {
        method: "POST",
        body: JSON.stringify({
          context: `Doctor ${user?.name || ""} is reviewing report for patient ${selectedPatient.name}.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to analyze report");

      setPatientReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, analysis: data, status: "analyzed" }
            : r
        )
      );
      toast.success("AI analysis completed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze report");
    } finally {
      setAnalyzingReportId(null);
    }
  };

  const addPrescriptionItem = () => {
    if (!rxItem.medicine || !rxItem.dosage || !rxItem.frequency || !rxItem.duration) {
      toast.error("Please fill all prescription fields");
      return;
    }
    setPrescriptions((prev) => [...prev, rxItem]);
    setRxItem({ medicine: "", dosage: "", frequency: "", duration: "" });
    logAudit("Prescription item added");
  };

  const applyQuickPreset = () => {
    setPrescriptions((prev) => [...prev, ...QUICK_RX_PRESETS]);
    toast.success("Quick prescription preset applied");
    logAudit("Quick Rx preset applied");
  };

  const saveSoapDraft = () => {
    if (!soapNote.subjective && !soapNote.objective && !soapNote.assessment && !soapNote.plan) {
      toast.error("Add note content before saving");
      return;
    }
    toast.success("SOAP note draft saved");
    logAudit("SOAP note saved");
  };

  const exportPrescription = () => {
    if (!prescriptions.length) {
      toast.error("Add at least one medicine to generate prescription");
      return;
    }
    toast.success("e-Prescription generated and shared");
    logAudit("e-Prescription generated");
  };

  const askCopilot = async () => {
    if (!copilotPrompt.trim()) {
      toast.error("Enter a clinical question for AI Copilot");
      return;
    }

    setCopilotLoading(true);
    try {
      const res = await apiCall("/chat/agent", {
        method: "POST",
        body: JSON.stringify({ message: copilotPrompt, model_id: "gpt-5.3-codex" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Copilot request failed");
      setCopilotResponse(data);
      logAudit("AI copilot consulted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to get AI suggestion");
    } finally {
      setCopilotLoading(false);
    }
  };

  const sendFollowUp = (patientName: string) => {
    toast.success(`Follow-up message sent to ${patientName}`);
    logAudit(`Follow-up message sent: ${patientName}`);
  };

  const sendTemplateMessage = () => {
    toast.success(`Template sent: ${messageTemplate}`);
    logAudit(`Communication template sent: ${messageTemplate}`);
  };

  const submitReferral = () => {
    if (!referralNote.trim()) {
      toast.error("Add referral details first");
      return;
    }
    toast.success("Referral shared with care team");
    logAudit("Referral submitted");
  };

  const fillCancelledSlot = () => {
    if (waitlistCount <= 0) {
      toast.info("No patients currently in waitlist");
      return;
    }
    setWaitlistCount((c) => c - 1);
    toast.success("Cancelled slot filled from waitlist");
    logAudit("Waitlist patient auto-scheduled");
  };

  const toggleProductivityTask = (id: string) => {
    setProductivityTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const closeDay = () => {
    const allDone = productivityTasks.every((t) => t.done);
    if (!allDone) {
      toast.error("Finish pending tasks before closing the day");
      return;
    }
    toast.success("End-of-day checklist completed");
    logAudit("End-of-day checklist completed");
  };

  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    try {
      await apiCall("/user/profile", {
        method: "PUT",
        body: JSON.stringify({ available: newVal }),
      });
      toast.success(newVal ? "You are now available for consultations" : "You are now set as unavailable");
    } catch {
      setIsAvailable(!newVal);
      toast.error("Failed to update availability");
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

  const TABS = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "care-os", label: "Care OS", icon: Bot },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "patients", label: "Patient Directory", icon: Users },
    { id: "profile", label: "Professional Profile", icon: User },
  ];

  if (!user) return null;

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-emerald-200 text-sm">Doctor Dashboard</p>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>{user.name}</h1>
                <p className="text-emerald-200 text-sm">{user.specialty || "General Medicine"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-colors">
                <span className="text-white text-sm">Available</span>
                <div
                  onClick={toggleAvailability}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isAvailable ? "bg-emerald-400" : "bg-white/30"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAvailable ? "translate-x-5" : "translate-x-0.5"}`}></div>
                </div>
              </label>
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
                      ? "bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-500"
                      : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
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

          {/* Main */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { icon: Calendar, label: "Total Appointments", value: consultations.length || user.consultations || 0, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
                        { icon: Users, label: "Total Patients", value: patients.length, color: "from-sky-500 to-blue-600", bg: "bg-sky-50" },
                        {
                          icon: Star,
                          label: "New Patients",
                          value: newPatientsCount,
                          color: "from-amber-500 to-orange-600", bg: "bg-amber-50"
                        },
                        { icon: DollarSign, label: "Consultations Fee", value: `₹${user.fee || 500}`, color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
                      ].map(({ icon: Icon, label, value, color, bg }) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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

                    {/* Today's Schedule */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>Today's Schedule</h2>
                        <span className="text-sm text-slate-500">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
                      </div>
                      <div className="space-y-3">
                        {TODAY_SCHEDULE.map((appt, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
                          >
                            <div className="text-center flex-shrink-0">
                              <p className="text-xs text-slate-500">Time</p>
                              <p className="font-bold text-slate-900 text-sm">{appt.time}</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 text-sm">{appt.patient}</p>
                              <p className="text-slate-500 text-xs">{appt.type} Consultation</p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              appt.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {appt.status}
                            </span>
                            <button className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center hover:bg-emerald-200 transition-colors">
                              <Video className="w-4 h-4 text-emerald-600" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200 p-6">
                      <h2 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Performance Overview</h2>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "Response Rate", value: "98%", icon: TrendingUp },
                          { label: "Avg. Duration", value: "24 min", icon: Clock },
                          { label: "Follow-ups", value: "85%", icon: CheckCircle },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="text-center p-3 bg-white/80 rounded-xl">
                            <Icon className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                            <p className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
                            <p className="text-xs text-slate-500">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "care-os" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-900 rounded-3xl p-6 text-white">
                      <p className="text-emerald-200 text-xs uppercase tracking-wider">Advanced Clinical Workspace</p>
                      <h2 className="text-2xl font-bold mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>Doctor Care OS</h2>
                      <p className="text-emerald-100/80 text-sm mt-2">Clinical decision support, AI copilot, operations, communication, and compliance in one panel.</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Clinical Decision Support</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} placeholder="Known allergies (comma separated)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                          <input value={symptomInput} onChange={(e) => setSymptomInput(e.target.value)} placeholder="Current symptoms" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                        </div>
                        {supportAlerts.length === 0 ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">No major conflicts detected. Continue standard care pathway.</div>
                        ) : (
                          <div className="space-y-2">
                            {supportAlerts.map((alert) => (
                              <div key={alert} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">{alert}</div>
                            ))}
                          </div>
                        )}
                        <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-800">Guideline reminder: For diabetic patients, review HbA1c every 3 months and annual retinal exam status.</div>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-teal-600" /> Smart Follow-up Queue</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {followUpQueue.length === 0 ? (
                            <p className="text-sm text-slate-500">No follow-ups generated yet.</p>
                          ) : followUpQueue.map((f) => (
                            <div key={f.patientId} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{f.patientName}</p>
                                <p className="text-xs text-slate-500">Due: {f.dueDate.toLocaleDateString()} ({f.daysToDue} day{Math.abs(f.daysToDue) === 1 ? "" : "s"})</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-bold ${
                                  f.priority === "high" ? "bg-red-100 text-red-700" : f.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                }`}>{f.priority}</span>
                                <button onClick={() => sendFollowUp(f.patientName)} className="text-xs px-2.5 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Message</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Pill className="w-4 h-4 text-emerald-600" /> e-Prescription Workspace</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={rxItem.medicine} onChange={(e) => setRxItem((p) => ({ ...p, medicine: e.target.value }))} placeholder="Medicine" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                          <input value={rxItem.dosage} onChange={(e) => setRxItem((p) => ({ ...p, dosage: e.target.value }))} placeholder="Dosage" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                          <input value={rxItem.frequency} onChange={(e) => setRxItem((p) => ({ ...p, frequency: e.target.value }))} placeholder="Frequency" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                          <input value={rxItem.duration} onChange={(e) => setRxItem((p) => ({ ...p, duration: e.target.value }))} placeholder="Duration" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={addPrescriptionItem} className="px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg">Add Medicine</button>
                          <button onClick={applyQuickPreset} className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg">Use Quick Preset</button>
                          <button onClick={exportPrescription} className="px-3 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg">Generate e-Prescription</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {prescriptions.map((p, idx) => (
                            <div key={`${p.medicine}-${idx}`} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <span>{p.medicine} · {p.dosage} · {p.frequency} · {p.duration}</span>
                            </div>
                          ))}
                          {prescriptions.length === 0 && <p className="text-xs text-slate-500">No medicines added yet.</p>}
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><BookOpenCheck className="w-4 h-4 text-violet-600" /> SOAP Notes</h3>
                        <div className="grid grid-cols-1 gap-2">
                          <textarea value={soapNote.subjective} onChange={(e) => setSoapNote((p) => ({ ...p, subjective: e.target.value }))} placeholder="Subjective" className="min-h-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                          <textarea value={soapNote.objective} onChange={(e) => setSoapNote((p) => ({ ...p, objective: e.target.value }))} placeholder="Objective" className="min-h-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                          <textarea value={soapNote.assessment} onChange={(e) => setSoapNote((p) => ({ ...p, assessment: e.target.value }))} placeholder="Assessment" className="min-h-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                          <textarea value={soapNote.plan} onChange={(e) => setSoapNote((p) => ({ ...p, plan: e.target.value }))} placeholder="Plan" className="min-h-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                        </div>
                        <button onClick={saveSoapDraft} className="px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg">Save SOAP Draft</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Bot className="w-4 h-4 text-sky-600" /> AI Copilot</h3>
                        <textarea value={copilotPrompt} onChange={(e) => setCopilotPrompt(e.target.value)} placeholder="Ask for differential diagnosis, next tests, red flags, or treatment pathways..." className="w-full min-h-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                        <button onClick={askCopilot} disabled={copilotLoading} className="inline-flex items-center gap-2 px-3 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg disabled:opacity-60">
                          {copilotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Generate Suggestion
                        </button>
                        {copilotResponse?.response && (
                          <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl">
                            <p className="text-xs font-semibold text-sky-700 mb-1">Copilot Suggestion</p>
                            <p className="text-sm text-slate-700 whitespace-pre-line">{copilotResponse.response}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-cyan-600" /> Lab & Imaging Trends</h3>
                        <div className="space-y-3">
                          {LAB_TRENDS.map((m) => {
                            const improved = m.latest <= m.previous;
                            const width = Math.min(100, Math.round((m.latest / Math.max(m.previous, m.latest)) * 100));
                            return (
                              <div key={m.marker} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center justify-between text-xs mb-2">
                                  <span className="font-semibold text-slate-700">{m.marker}</span>
                                  <span className={improved ? "text-emerald-700" : "text-amber-700"}>{m.previous}{m.unit} {"->"} {m.latest}{m.unit}</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={`h-full ${improved ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${width}%` }}></div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">Target: {m.target}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Estimated Revenue", value: `₹${totalRevenueEstimate.toLocaleString()}`, icon: Wallet },
                        { label: "No-show Rate", value: `${noShowRate}%`, icon: AlertTriangle },
                        { label: "Avg Duration", value: `${averageDuration} min`, icon: Clock },
                        { label: "Utilization", value: `${utilization}%`, icon: TrendingUp },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                          <Icon className="w-4 h-4 text-emerald-600 mb-2" />
                          <p className="text-xl font-bold text-slate-900">{value}</p>
                          <p className="text-xs text-slate-500">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-emerald-600" /> Appointment Intelligence</h3>
                        <p className="text-xs text-slate-500">Detected overlaps: <span className="font-bold text-slate-700">{Math.ceil(overlapAppointments.length / 2)}</span></p>
                        <p className="text-xs text-slate-500">Waitlist patients: <span className="font-bold text-slate-700">{waitlistCount}</span></p>
                        <button onClick={fillCancelledSlot} className="px-3 py-2 bg-emerald-600 text-white text-xs rounded-lg font-semibold">Auto-fill Cancelled Slot</button>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-sky-600" /> Communication Center</h3>
                        <select value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                          <option>Medication Reminder</option>
                          <option>Lab Test Follow-up</option>
                          <option>Post-consult Care Advice</option>
                        </select>
                        <button onClick={sendTemplateMessage} className="inline-flex items-center gap-2 px-3 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg">
                          <Send className="w-3.5 h-3.5" /> Send Template
                        </button>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><UsersRound className="w-4 h-4 text-violet-600" /> Care Team Collaboration</h3>
                        <textarea value={referralNote} onChange={(e) => setReferralNote(e.target.value)} placeholder="Referral summary, context, and specialist request" className="w-full min-h-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" checked={secondOpinionRequested} onChange={(e) => setSecondOpinionRequested(e.target.checked)} /> Request second opinion
                        </label>
                        <button onClick={submitReferral} className="px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg">Share Referral</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Compliance & Medico-legal</h3>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={consentCaptured} onChange={(e) => { setConsentCaptured(e.target.checked); logAudit(e.target.checked ? "Consent captured" : "Consent unchecked"); }} />
                          Consent captured for this consultation
                        </label>
                        <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                          {auditLogs.length === 0 ? (
                            <p className="text-xs text-slate-500">No audit entries yet.</p>
                          ) : auditLogs.map((log) => (
                            <div key={log} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200">{log}</div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-teal-600" /> Personal Productivity</h3>
                        <div className="space-y-2">
                          {productivityTasks.map((task) => (
                            <label key={task.id} className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded-lg hover:bg-slate-50">
                              <input type="checkbox" checked={task.done} onChange={() => toggleProductivityTask(task.id)} />
                              <span className={task.done ? "line-through text-slate-400" : ""}>{task.title}</span>
                            </label>
                          ))}
                        </div>
                        <button onClick={closeDay} className="px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg">Close Day Checklist</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointments Tab */}
                {activeTab === "appointments" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>Appointment History</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{filteredAppointments.length} Showing</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                      <div className="relative sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          value={appointmentSearch}
                          onChange={(e) => setAppointmentSearch(e.target.value)}
                          type="text"
                          placeholder="Search by patient, status or specialty"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                        <Filter className="w-4 h-4 text-slate-500 ml-2" />
                        {[
                          { id: "all", label: "All" },
                          { id: "upcoming", label: "Upcoming" },
                          { id: "past", label: "Past" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setAppointmentFilter(f.id as "all" | "past" | "upcoming")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                              appointmentFilter === f.id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-white"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {filteredAppointments.length === 0 ? (
                      <div className="text-center py-16">
                        <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500">No appointments match this filter</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden">
                        <div className="space-y-4">
                          {filteredAppointments.map((c) => (
                            <div key={c.id} className="p-4 border border-slate-100 rounded-2xl hover:border-emerald-200 transition-colors group">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <User className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{c.patientName}</p>
                                    <p className="text-slate-500 text-xs flex items-center gap-2">
                                      <Calendar className="w-3 h-3" /> {c.date} 
                                      <Clock className="w-3 h-3 ml-1" /> {c.time}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                    c.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {c.status}
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-1">{c.type} Session</p>
                                </div>
                              </div>
                              {c.symptoms && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight mb-1">Stated Symptoms</p>
                                  <p className="text-sm text-slate-700 leading-relaxed">{c.symptoms}</p>
                                </div>
                              )}
                              {(c.type || "").toLowerCase() === "video" && c.meetingLink && (
                                <div className="mt-4 flex justify-end">
                                  <a
                                    href={c.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                                  >
                                    <Video className="w-3.5 h-3.5" /> Join Video Call
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>Doctor Profile</h2>
                      <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                        <Edit2 className="w-4 h-4" /> Edit Profile
                      </button>
                    </div>
                    <div className="flex items-center gap-5 mb-8 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>{user.name}</h3>
                        <p className="text-emerald-600 font-medium">{user.specialty}</p>
                        <p className="text-slate-500 text-sm">{user.qualifications || "Medical Professional"}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-semibold text-slate-700">{user.rating || 4.5}</span>
                          <span className="text-slate-400 text-sm">·</span>
                          <span className="text-sm text-slate-500">{user.experience || "10+ Years"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", value: user.name },
                        { label: "Email", value: user.email },
                        { label: "Specialty", value: user.specialty || "General Medicine" },
                        { label: "Experience", value: user.experience || "Not specified" },
                        { label: "Consultation Fee", value: `₹${user.fee || 500}` },
                        { label: "Availability", value: isAvailable ? "Available ✅" : "Unavailable ❌" },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                          <p className="font-semibold text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>
                    {user.bio && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-2">About</p>
                        <p className="text-slate-700 text-sm leading-relaxed">{user.bio}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Patients Tab */}
                {activeTab === "patients" && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>Patient Directory</h2>
                      <div className="relative">
                        <input
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          type="text"
                          placeholder="Search patients..."
                          className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-16">
                        <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500">No patients found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPatients.map((p) => (
                          <motion.div
                            key={p.id}
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              setSelectedPatient(p);
                              fetchPatientReports(p.id);
                            }}
                            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center text-emerald-700 font-bold text-lg group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:text-white transition-all">
                              {p.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 truncate">{p.name}</p>
                              <p className="text-xs text-slate-500 truncate mb-2">{p.email}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium">
                                  {p.totalConsultations} Visits
                                </span>
                                <span className="text-[10px] text-slate-400">Last: {p.lastVisit}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Patient File Slide-over */}
      <AnimatePresence>
        {activeTab === "patients" && selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            onClick={() => setSelectedPatient(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                      {selectedPatient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>{selectedPatient.name}</h2>
                      <p className="text-emerald-100 text-sm">{selectedPatient.email}</p>
                      <p className="text-emerald-100 text-xs mt-1">Patient ID: {selectedPatient.id.slice(0, 10)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="px-3 py-2 bg-white/20 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500">Total Consultations</p>
                    <p className="text-xl font-bold text-slate-900">{selectedPatient.totalConsultations}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500">Last Visit</p>
                    <p className="text-xl font-bold text-slate-900">{formatDate(selectedPatient.lastVisit)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" /> Consultation History
                  </h3>
                  <div className="space-y-3">
                    {consultations
                      .filter((c) => c.patientId === selectedPatient.id)
                      .sort((a, b) => getConsultationDateTime(b).getTime() - getConsultationDateTime(a).getTime())
                      .map((c) => (
                        <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">{formatDate(c.date)} · {c.time}</p>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-bold ${
                              c.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                            }`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{c.type} consultation</p>
                          {c.symptoms && (
                            <p className="text-sm text-slate-700 mt-2 italic">"{c.symptoms}"</p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" /> Medical Reports & AI Analysis
                  </h3>
                  {loadingReports ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    </div>
                  ) : patientReports.length === 0 ? (
                    <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No reports uploaded by this patient</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientReports.map((r) => (
                        <div key={r.id} className="p-4 border border-slate-200 rounded-2xl">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{r.fileName}</p>
                              <p className="text-xs text-slate-500">
                                {formatDate(r.uploadedAt)} · {(r.fileSize / 1024).toFixed(1)} KB · {r.status || "uploaded"}
                              </p>
                            </div>
                            <button
                              onClick={() => analyzeReport(r)}
                              disabled={analyzingReportId === r.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {analyzingReportId === r.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                              Analyze
                            </button>
                          </div>

                          {r.analysis?.summary && (
                            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                              <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide mb-1">AI Summary</p>
                              <p className="text-sm text-emerald-900">{r.analysis.summary}</p>
                              {r.analysis.risk_level && (
                                <p className="text-xs text-emerald-800 mt-2">Risk Level: <span className="font-semibold">{r.analysis.risk_level}</span></p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
