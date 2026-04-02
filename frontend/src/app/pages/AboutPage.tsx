import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Target, Heart, Shield, Zap, Users, Award, Globe, Brain,
  ArrowRight, CheckCircle, Star, Stethoscope, Video, FileText
} from "lucide-react";

const TEAM_IMAGE = "https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800";
const ABOUT_HERO = "https://images.unsplash.com/photo-1758202292826-c40e172eed1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200";

const VALUES = [
  { icon: Heart, title: "Patient First", desc: "Every decision we make starts with patient wellbeing and accessibility in mind.", color: "from-rose-500 to-pink-600" },
  { icon: Shield, title: "Privacy & Security", desc: "HIPAA-compliant infrastructure with end-to-end encryption for all health data.", color: "from-sky-500 to-blue-600" },
  { icon: Zap, title: "Innovation", desc: "Continuously leveraging cutting-edge AI to improve healthcare outcomes.", color: "from-violet-500 to-purple-600" },
  { icon: Globe, title: "Accessibility", desc: "Making world-class healthcare accessible to every person, regardless of location.", color: "from-emerald-500 to-teal-600" },
];

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="pt-20 overflow-x-hidden">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 to-indigo-950 overflow-hidden">
        <div className="absolute inset-0">
          <img src={ABOUT_HERO} alt="About Medi+" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-80 h-80 bg-sky-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-violet-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 rounded-full px-4 py-2 mb-6"
          >
            <Heart className="w-4 h-4 text-sky-400" />
            <span className="text-sky-300 text-sm font-medium">About Medi+</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Redefining Healthcare
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
              Through Technology
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-xl leading-relaxed max-w-3xl mx-auto"
          >
            Medi+ was born from a simple belief: quality healthcare should be accessible to everyone, everywhere.
            We combine AI intelligence with human expertise to make that a reality.
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-sky-100 rounded-full px-4 py-2 mb-6">
                <Target className="w-4 h-4 text-sky-600" />
                <span className="text-sky-700 text-sm font-semibold">Our Mission</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Making Quality Healthcare
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600"> Universal</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                We believe that the best medical care shouldn't depend on where you live, your income, or the time of day. Medi+ bridges the gap between patients and world-class specialists through cutting-edge telemedicine.
              </p>
              <div className="space-y-3">
                {[
                  "Remove geographic barriers to healthcare",
                  "Make specialist consultation affordable for all",
                  "Empower patients with AI-driven health insights",
                  "Support doctors with intelligent tools",
                  "Build a healthier India through technology",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img src={TEAM_IMAGE} alt="Medical Team" className="rounded-3xl shadow-2xl w-full h-96 object-cover" />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-3xl shadow-xl p-5 border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "500+", label: "Doctors" },
                    { value: "50K+", label: "Patients" },
                    { value: "1M+", label: "Consults" },
                    { value: "4.9★", label: "Rating" },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <p className="text-xl font-bold text-sky-600" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Our Core Values
            </h2>
            <p className="text-slate-500 text-lg">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition-shadow text-center"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Technology That Powers Us
            </h2>
            <p className="text-slate-400 text-lg">Built with enterprise-grade technology for reliability and scale</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Brain, label: "AI & Machine Learning", desc: "NLP-powered health chatbot and report analysis" },
              { icon: Shield, label: "Security First", desc: "HIPAA-compliant, AES-256 encryption" },
              { icon: Video, label: "HD Video Tech", desc: "WebRTC-powered crystal clear video calls" },
              { icon: Globe, label: "Cloud Infrastructure", desc: "99.9% uptime with global CDN delivery" },
            ].map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-sky-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{label}</h3>
                <p className="text-slate-400 text-xs">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-sky-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Be Part of the Healthcare Revolution
          </h2>
          <p className="text-sky-100 text-lg mb-8">Join Medi+ today and experience the future of healthcare.</p>
          <button
            onClick={() => navigate("/auth?mode=register")}
            className="px-8 py-4 bg-white text-sky-700 font-bold rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all text-lg flex items-center gap-2 mx-auto"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
