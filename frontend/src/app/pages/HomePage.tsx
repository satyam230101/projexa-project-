import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { HealthReportUpload } from "../components/HealthReportUpload";
import { motion } from "motion/react";
import {
  Video, Brain, Shield, Clock, Star, ArrowRight, ChevronRight,
  Users, Award, Activity, Zap, Heart, CheckCircle, Stethoscope,
  FileText, MessageCircle, Globe, Play, ChevronDown
} from "lucide-react";

const HERO_IMAGE = "https://images.unsplash.com/photo-1758691461916-dc7894eb8f94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";
const AI_IMAGE = "https://images.unsplash.com/photo-1758202292826-c40e172eed1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800";
const TEAM_IMAGE = "https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800";

const DOCTORS = [
  { id: "doc1", name: "Dr. Arjun Sharma", specialty: "Cardiologist", rating: 4.9, consultations: 2450, available: true, image: "https://images.unsplash.com/photo-1699883430258-785510b807db?w=200" },
  { id: "doc2", name: "Dr. Priya Menon", specialty: "Pediatrician", rating: 4.8, consultations: 1890, available: true, image: "https://images.unsplash.com/photo-1628320645101-5a41b1f88c0b?w=200" },
  { id: "doc4", name: "Dr. Sneha Reddy", specialty: "Dermatologist", rating: 4.7, consultations: 1650, available: true, image: "https://images.unsplash.com/photo-1757125736482-328a3cdd9743?w=200" },
  { id: "doc5", name: "Dr. Anil Kumar", specialty: "Orthopedic", rating: 4.8, consultations: 4100, available: true, image: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?w=200" },
];

const STATS = [
  { icon: Users, value: "50,000+", label: "Happy Patients", color: "from-sky-400 to-blue-500" },
  { icon: Stethoscope, value: "500+", label: "Expert Doctors", color: "from-emerald-400 to-teal-500" },
  { icon: Video, value: "1M+", label: "Consultations", color: "from-violet-400 to-purple-500" },
  { icon: Award, value: "4.9/5", label: "Average Rating", color: "from-amber-400 to-orange-500" },
];

const FEATURES = [
  { icon: Video, title: "HD Video Consultation", desc: "Crystal-clear video calls with top doctors from anywhere, anytime.", color: "from-sky-500 to-blue-600", bg: "bg-sky-50" },
  { icon: Brain, title: "AI Health Assistant", desc: "24/7 AI-powered chatbot for instant health guidance and symptom analysis.", color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
  { icon: FileText, title: "Digital Health Reports", desc: "Upload, analyze and share health reports securely with your doctors.", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
  { icon: Shield, title: "HIPAA Compliant Security", desc: "Bank-level encryption keeps your medical data safe and private.", color: "from-rose-500 to-pink-600", bg: "bg-rose-50" },
  { icon: Clock, title: "24/7 Availability", desc: "Round-the-clock medical support including emergency consultations.", color: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
  { icon: Globe, title: "Multi-Language Support", desc: "Consult in 15+ languages including Hindi, Tamil, Telugu, and more.", color: "from-cyan-500 to-teal-600", bg: "bg-cyan-50" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create Account", desc: "Quick registration as a patient, doctor, or general user in under 2 minutes.", icon: Users },
  { step: "02", title: "Choose Your Doctor", desc: "Browse specialists by category, ratings, and availability. Filter by language.", icon: Stethoscope },
  { step: "03", title: "Book & Connect", desc: "Schedule a slot and join HD video consultation from any device.", icon: Video },
  { step: "04", title: "Stay Healthy", desc: "Get prescription, follow-up care, and track your health journey.", icon: Heart },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="overflow-x-hidden">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Healthcare" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-sky-950/30 to-transparent"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-32 right-[15%] hidden lg:block">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Live Consultation</span>
            </div>
            <p className="text-xs text-white/70">Dr. Arjun Sharma</p>
            <p className="text-xs text-sky-300">Cardiologist • Available Now</p>
          </motion.div>
        </div>

        <div className="absolute bottom-40 right-[8%] hidden lg:block">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-medium">AI Analysis Complete</span>
            </div>
            <p className="text-xs text-white/70 mt-1">Report analyzed in 2.3s</p>
            <div className="mt-2 h-1 bg-white/20 rounded-full">
              <div className="h-1 bg-emerald-400 rounded-full w-[85%]"></div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 rounded-full px-4 py-2 mb-6"
            >
              <Zap className="w-4 h-4 text-sky-400" />
              <span className="text-sky-300 text-sm font-medium">AI-Powered Telemedicine Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Your Health,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                Our Priority
              </span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl">Anytime, Anywhere</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-white/70 text-lg sm:text-xl leading-relaxed mb-8"
            >
              Connect with 500+ verified specialists via HD video consultation. Get AI-powered health insights, manage your reports, and receive world-class care — all from one platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-10"
            >
              <button
                onClick={() => {
                  if (!user) navigate("/auth?mode=register");
                  else if (user.role === "doctor") navigate("/doctor/dashboard");
                  else navigate("/consultation");
                }}
                className="group px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-sky-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {user ? (user.role === "doctor" ? "Go to Dashboard" : "Book Consultation") : "Get Started Free"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  if (user?.role === "doctor") {
                    navigate("/doctor/dashboard");
                    return;
                  }
                  navigate("/consultation");
                }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                {user?.role === "doctor" ? "Doctor Dashboard" : "Book Consultation"}
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-wrap gap-6"
            >
              {[
                { icon: Shield, text: "HIPAA Compliant" },
                { icon: Award, text: "ISO 27001 Certified" },
                { icon: CheckCircle, text: "500+ Verified Doctors" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/60">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-1 text-white/40"
          >
            <span className="text-xs">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Section ─────────────────────────────────────────── */}
      <section className="relative -mt-20 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, value, label, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-5 flex flex-col items-center text-center border border-slate-100 hover:shadow-2xl transition-shadow"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
              <p className="text-slate-500 text-xs mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features Section ──────────────────────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-sky-100 rounded-full px-4 py-2 mb-4"
          >
            <Zap className="w-4 h-4 text-sky-600" />
            <span className="text-sky-700 text-sm font-semibold">Platform Features</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Everything You Need for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600"> Better Health</span>
          </motion.h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Medi+ combines cutting-edge AI technology with expert medical care to deliver a complete healthcare experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-sky-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                {title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              <button className="mt-4 flex items-center gap-1 text-sky-600 text-sm font-medium hover:gap-2 transition-all">
                Learn more <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── AI Health Assistant Section ──────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-indigo-950 relative overflow-hidden" id="ai-chat">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-sky-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-full px-4 py-2 mb-6">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-violet-300 text-sm font-medium">AI-Powered Intelligence</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Meet MediBot,
                <br />
                Your AI Health
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400"> Companion</span>
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Our advanced AI assistant provides instant health guidance, symptom analysis, and medication information — available 24/7, powered by medical intelligence.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Zap, text: "Instant symptom assessment and first-aid guidance" },
                  { icon: Brain, text: "AI analysis of health reports and lab values" },
                  { icon: MessageCircle, text: "Natural conversation in multiple Indian languages" },
                  { icon: Shield, text: "Privacy-first with end-to-end encryption" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-slate-300 text-sm">{text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {}}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-violet-500/30 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chat with MediBot
                <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Free</span>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src={AI_IMAGE} alt="AI Healthcare" className="w-full h-80 lg:h-[500px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-violet-400" />
                      <span className="text-white text-sm font-semibold">AI Analysis Result</span>
                    </div>
                    <p className="text-slate-300 text-xs">Based on your symptoms, 3 possible conditions identified. Recommending consultation with a General Physician.</p>
                    <div className="mt-3 flex gap-2">
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full">Low Risk</span>
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">Consult Recommended</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Health Report Upload Section ─────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-2 mb-6">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 text-sm font-semibold">Smart Health Reports</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Upload & Analyze
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                  Health Reports
                </span>
              </h2>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                Securely upload your medical reports, lab results, prescriptions, and imaging studies. Our AI instantly analyzes and highlights key findings for your doctor.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { value: "2.3s", label: "Avg. Analysis Time" },
                  { value: "99.2%", label: "Accuracy Rate" },
                  { value: "20MB", label: "Max File Size" },
                  { value: "15+", label: "Report Types" },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <p className="text-2xl font-bold text-sky-600" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
                    <p className="text-slate-500 text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <HealthReportUpload />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              How <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">Medi+</span> Works
            </motion.h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Get quality healthcare in just 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-sky-300 to-transparent z-0"></div>
                )}
                <div className="relative z-10">
                  <div className="text-6xl font-black text-sky-100 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>{step}</div>
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto -mt-8 mb-4 shadow-lg shadow-sky-500/30">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => {
                if (!user) navigate("/auth?mode=register");
                else if (user.role === "doctor") navigate("/doctor/dashboard");
                else navigate("/consultation");
              }}
              className="px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-1 transition-all text-lg"
            >
              {user?.role === "doctor" ? "Visit Doctor Dashboard" : "Start Your Journey Today"}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Top Doctors ───────────────────────────────────────────── */}
      {user?.role !== "doctor" && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-2 bg-sky-100 rounded-full px-4 py-2 mb-4">
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  <span className="text-sky-700 text-sm font-semibold">Top Specialists</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Meet Our Expert Doctors
                </h2>
              </div>
              <button
                onClick={() => navigate("/consultation")}
                className="hidden sm:flex items-center gap-2 text-sky-600 font-semibold hover:gap-3 transition-all"
              >
                View All <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {DOCTORS.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 hover:shadow-xl transition-all group"
                >
                  <div className="relative mb-4">
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-full h-48 object-cover rounded-2xl"
                    />
                    {doc.available && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        Available
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>{doc.name}</h3>
                  <p className="text-sky-600 text-sm font-medium mb-2">{doc.specialty}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {doc.rating}
                    </span>
                    <span>{doc.consultations.toLocaleString()} consults</span>
                  </div>
                  <button
                    onClick={() => navigate("/consultation")}
                    className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all"
                  >
                    Book Consultation
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Section ───────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-sky-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Start Your Healthcare Journey Today
          </motion.h2>
          <p className="text-sky-100 text-xl mb-10">
            Join 50,000+ patients who trust Medi+ for their healthcare needs. First consultation is absolutely FREE!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                if (user?.role === "doctor") navigate("/doctor/dashboard");
                else navigate("/auth?mode=register&role=patient");
              }}
              className="px-8 py-4 bg-white text-sky-600 font-bold rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all text-lg"
            >
              {user?.role === "doctor" ? "Go to Dashboard" : "Register as Patient"}
            </button>
            <button
              onClick={() => {
                if (user?.role === "doctor") navigate("/doctor/dashboard");
                else navigate("/auth?mode=register&role=doctor");
              }}
              className="px-8 py-4 bg-white/10 border-2 border-white/40 text-white font-bold rounded-2xl hover:bg-white/20 transition-all text-lg"
            >
              {user?.role === "doctor" ? "Manage Patients" : "Join as Doctor"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
