import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Send, Loader2, MessageCircle,
  CheckCircle, ChevronDown, ChevronUp
} from "lucide-react";

const FAQS = [
  { q: "How do I book a consultation?", a: "Simply create an account, go to the Consultation page, choose your specialist, select a date and time, and confirm your booking. It takes less than 2 minutes!" },
  { q: "What technical requirements are needed for video consultation?", a: "You need a device (phone, tablet, or computer) with a working camera, microphone, and a stable internet connection (minimum 1 Mbps). Our platform works on all modern browsers." },
  { q: "How is my health data secured?", a: "All your health data is encrypted with AES-256 encryption. We are HIPAA compliant and ISO 27001 certified. Your data is never shared without your explicit consent." },
  { q: "Can I get a prescription after consultation?", a: "Yes! Registered doctors on Medi+ can issue digital prescriptions after your consultation. These are legally valid and can be downloaded from your dashboard." },
  { q: "What if I miss my appointment?", a: "You can reschedule up to 30 minutes before your appointment. If the doctor misses the call, you will get a full refund or free rescheduling." },
  { q: "Is Medi+ available 24/7?", a: "The AI health assistant is available 24/7. Doctor consultations are available based on individual doctor schedules, with emergency consultations available round the clock." },
];

export function ContactPage() {
  const { apiCall } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiCall("/contact", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="pt-20 overflow-x-hidden">
      {/* Hero */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-5"
          >
            <MessageCircle className="w-4 h-4 text-sky-200" />
            <span className="text-sky-100 text-sm font-medium">Contact Us</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            We're Here to Help
          </motion.h1>
          <p className="text-sky-200 text-lg">Have questions? We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Contact Form */}
          <div>
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-lg p-12 text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Message Sent!
                </h2>
                <p className="text-slate-500 text-lg mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                  className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-colors"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Send Us a Message</h2>
                <p className="text-slate-500 mb-6">Fill out the form below and we'll get back to you shortly.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        placeholder="Your full name"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        placeholder="you@example.com"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateForm("phone", e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => updateForm("subject", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
                      >
                        <option value="">Select a subject</option>
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Billing Issue">Billing Issue</option>
                        <option value="Doctor Registration">Doctor Registration</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Feedback">Feedback</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => updateForm("message", e.target.value)}
                      placeholder="Describe your query in detail..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="w-5 h-5" /> Send Message</>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-lg">Quick answers to common questions</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4">{q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-sky-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 border-t border-slate-100 bg-sky-50/50">
                    <p className="text-slate-600 text-sm leading-relaxed pt-3">{a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
