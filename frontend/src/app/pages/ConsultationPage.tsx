import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Filter, Star, Clock, Video, Phone, MessageCircle,
  Calendar, CheckCircle, X, ChevronDown, Loader2, Globe,
  Award, Users, ArrowLeft, Heart, Stethoscope
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  available: boolean;
  fee: number;
  image: string;
  bio: string;
  qualifications: string;
  languages: string[];
  consultations: number;
}

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  "04:30 PM", "05:00 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
];

const SPECIALTIES = [
  "All", "Cardiologist", "Pediatrician", "Neurologist", "Dermatologist",
  "Orthopedic Surgeon", "Gynecologist", "General Medicine", "Psychiatrist", "Endocrinologist",
];

export function ConsultationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, apiCall } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const initialSpecialty = searchParams.get("specialty") || "All";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [showAvailable, setShowAvailable] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingStep, setBookingStep] = useState<"details" | "schedule" | "confirm" | "success">("details");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [consultType, setConsultType] = useState<"video" | "phone" | "chat">("video");
  const [symptoms, setSymptoms] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedConsultation, setBookedConsultation] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (user?.role === "doctor") {
      toast.info("As a doctor, please use your dashboard to manage consultations.");
      navigate("/doctor/dashboard");
      return;
    }
    loadDoctors();
  }, [selectedSpecialty, showAvailable, user]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSpecialty !== "All") params.set("specialty", selectedSpecialty);
      if (showAvailable) params.set("available", "true");

      const res = await apiCall(`/doctors?${params.toString()}`);
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBooking = async () => {
    if (!user) { toast.error("Please login to book a consultation"); navigate("/auth"); return; }
    if (user.role === "doctor") {
      toast.info("Doctors cannot book consultations. Use your dashboard to manage appointments.");
      navigate("/doctor/dashboard");
      return;
    }
    if (!selectedDate || !selectedTime) { toast.error("Please select date and time"); return; }

    setBookingLoading(true);
    try {
      const res = await apiCall("/consultations", {
        method: "POST",
        body: JSON.stringify({
          doctorId: selectedDoctor?.id,
          doctorName: selectedDoctor?.name,
          specialty: selectedDoctor?.specialty,
          date: selectedDate,
          time: selectedTime,
          type: consultType,
          symptoms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setBookedConsultation(data.consultation);
      setBookingStep("success");
      toast.success("Consultation booked successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setBookingStep("details");
    setSelectedDate("");
    setSelectedTime("");
    setSymptoms("");
    setBookedConsultation(null);
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  if (user?.role === "doctor") {
    return (
      <div className="pt-24 min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
            <Stethoscope className="w-12 h-12 text-sky-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              Doctor Accounts Cannot Book Consultations
            </h1>
            <p className="text-slate-600 mb-6">
              Please use your dashboard to view patients, appointments, and reports.
            </p>
            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors"
            >
              Go to Doctor Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4"
            >
              <Video className="w-4 h-4 text-sky-200" />
              <span className="text-sky-100 text-sm font-medium">HD Video Consultation</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Find Your Doctor
            </motion.h1>
            <p className="text-sky-200 text-lg">500+ verified specialists across all medical fields</p>
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by doctor name or specialty..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-800 placeholder:text-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-sky-300 shadow-xl"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedSpecialty === spec
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-500/30"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-600"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 ml-auto">
            <input
              type="checkbox"
              checked={showAvailable}
              onChange={(e) => setShowAvailable(e.target.checked)}
              className="rounded text-sky-500"
            />
            <span className="text-sm text-slate-600">Available Now</span>
          </label>
        </div>

        {/* Results Count */}
        <p className="text-slate-500 text-sm mb-6">
          {loading ? "Loading doctors..." : `Showing ${filteredDoctors.length} specialist${filteredDoctors.length !== 1 ? "s" : ""}`}
        </p>

        {/* Doctor Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
              <p className="text-slate-500">Loading specialists...</p>
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-24">
            <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No doctors found</p>
            <button onClick={() => { setSearchTerm(""); setSelectedSpecialty("All"); }} className="mt-4 text-sky-600 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-3xl border border-slate-100 hover:shadow-xl hover:border-sky-200 transition-all group"
              >
                <div className="relative">
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className="w-full h-52 object-cover rounded-t-3xl"
                  />
                  <div className="absolute top-3 right-3">
                    {doc.available ? (
                      <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Available
                      </span>
                    ) : (
                      <span className="bg-slate-700/80 text-white text-xs px-2.5 py-1 rounded-full">Busy</span>
                    )}
                  </div>
                  <button className="absolute top-3 left-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Heart className="w-4 h-4 text-slate-400 hover:text-red-500" />
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-0.5" style={{ fontFamily: "Poppins, sans-serif" }}>{doc.name}</h3>
                  <p className="text-sky-600 text-sm font-medium mb-3">{doc.specialty}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {doc.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {doc.experience}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {(doc.consultations || 0).toLocaleString()}+
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">{doc.bio}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                        ₹{doc.fee}
                      </span>
                      <span className="text-slate-500 text-xs ml-1">/ session</span>
                    </div>
                    <div className="flex gap-1">
                      {["video", "phone", "chat"].map((type) => (
                        <div key={type} className="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center">
                          {type === "video" && <Video className="w-3.5 h-3.5 text-sky-600" />}
                          {type === "phone" && <Phone className="w-3.5 h-3.5 text-sky-600" />}
                          {type === "chat" && <MessageCircle className="w-3.5 h-3.5 text-sky-600" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => { setSelectedDoctor(doc); setBookingStep("details"); }}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 group-hover:-translate-y-0.5 transition-all"
                  >
                    Book Consultation
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 p-5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-3">
                  {bookingStep !== "details" && bookingStep !== "success" && (
                    <button onClick={() => setBookingStep(bookingStep === "schedule" ? "details" : "schedule")} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg">
                      <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {bookingStep === "details" ? "Doctor Details" :
                       bookingStep === "schedule" ? "Schedule Appointment" :
                       bookingStep === "confirm" ? "Confirm Booking" : "Booking Confirmed!"}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      {["details", "schedule", "confirm"].map((step, i) => (
                        <div key={step} className={`h-1 rounded-full transition-all ${
                          ["details", "schedule", "confirm"].indexOf(bookingStep) >= i ? "bg-sky-500 w-6" : "bg-slate-200 w-4"
                        }`} />
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-5">
                {/* Step: Doctor Details */}
                {bookingStep === "details" && (
                  <div>
                    <div className="flex gap-4 mb-6">
                      <img src={selectedDoctor.image} alt={selectedDoctor.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>{selectedDoctor.name}</h4>
                        <p className="text-sky-600 font-medium text-sm">{selectedDoctor.specialty}</p>
                        <p className="text-slate-500 text-xs mt-1">{selectedDoctor.qualifications}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {selectedDoctor.rating}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedDoctor.experience}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-sky-50 rounded-xl p-3 border border-sky-100">
                        <p className="text-xs text-slate-500">Consultation Fee</p>
                        <p className="text-2xl font-bold text-sky-600" style={{ fontFamily: "Poppins, sans-serif" }}>₹{selectedDoctor.fee}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                        <p className="text-xs text-slate-500">Status</p>
                        <p className={`font-semibold text-sm ${selectedDoctor.available ? "text-emerald-600" : "text-slate-500"}`}>
                          {selectedDoctor.available ? "✅ Available Now" : "⏳ Next Slot"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Languages</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedDoctor.languages || ["English"]).map((lang) => (
                          <span key={lang} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm font-medium text-slate-700 mb-2">About</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{selectedDoctor.bio}</p>
                    </div>

                    <button
                      onClick={() => setBookingStep("schedule")}
                      className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      Schedule Appointment →
                    </button>
                  </div>
                )}

                {/* Step: Schedule */}
                {bookingStep === "schedule" && (
                  <div>
                    {/* Consult Type */}
                    <div className="mb-5">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Consultation Type</p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { type: "video", icon: Video, label: "Video Call" },
                          { type: "phone", icon: Phone, label: "Phone Call" },
                          { type: "chat", icon: MessageCircle, label: "Chat" },
                        ] as const).map(({ type, icon: Icon, label }) => (
                          <button
                            key={type}
                            onClick={() => setConsultType(type)}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                              consultType === type
                                ? "border-sky-400 bg-sky-50"
                                : "border-slate-200 hover:border-sky-200"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${consultType === type ? "text-sky-600" : "text-slate-500"}`} />
                            <span className={`text-xs font-medium ${consultType === type ? "text-sky-700" : "text-slate-600"}`}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <Calendar className="inline w-4 h-4 mr-1" /> Select Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={getMinDate()}
                        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
                      />
                    </div>

                    {/* Time Slots */}
                    <div className="mb-5">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Select Time Slot</p>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`p-2 text-xs rounded-lg border transition-all ${
                              selectedTime === slot
                                ? "bg-sky-600 text-white border-sky-600"
                                : "border-slate-200 text-slate-600 hover:border-sky-300"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Describe your symptoms (optional)</label>
                      <textarea
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Briefly describe your symptoms or reason for consultation..."
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50 resize-none"
                      />
                    </div>

                    <button
                      onClick={() => { if (!selectedDate || !selectedTime) { toast.error("Please select date and time"); return; } setBookingStep("confirm"); }}
                      className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      Review Booking →
                    </button>
                  </div>
                )}

                {/* Step: Confirm */}
                {bookingStep === "confirm" && (
                  <div>
                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-5 mb-5">
                      <div className="flex gap-3 mb-4">
                        <img src={selectedDoctor.image} alt={selectedDoctor.name} className="w-14 h-14 rounded-xl object-cover" />
                        <div>
                          <p className="font-bold text-slate-900">{selectedDoctor.name}</p>
                          <p className="text-sky-600 text-sm">{selectedDoctor.specialty}</p>
                        </div>
                      </div>
                      {[
                        { label: "Date", value: selectedDate, icon: Calendar },
                        { label: "Time", value: selectedTime, icon: Clock },
                        { label: "Type", value: `${consultType.charAt(0).toUpperCase() + consultType.slice(1)} Consultation`, icon: Video },
                        { label: "Fee", value: `₹${selectedDoctor.fee}`, icon: Award },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex items-center gap-2 py-2 border-b border-sky-100 last:border-0">
                          <Icon className="w-4 h-4 text-sky-500" />
                          <span className="text-slate-500 text-sm flex-1">{label}</span>
                          <span className="font-semibold text-slate-900 text-sm">{value}</span>
                        </div>
                      ))}
                    </div>

                    {symptoms && (
                      <div className="bg-slate-50 rounded-xl p-3 mb-5 border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-1">Symptoms Notes:</p>
                        <p className="text-sm text-slate-700">{symptoms}</p>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
                      <p className="text-xs text-amber-700">
                        💳 Payment will be collected before the consultation starts. A meeting link will be sent to your registered email.
                      </p>
                    </div>

                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {bookingLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</> : "Confirm & Pay ₹" + selectedDoctor.fee}
                    </button>
                  </div>
                )}

                {/* Step: Success */}
                {bookingStep === "success" && (
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5"
                    >
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Booked Successfully!
                    </h3>
                    <p className="text-slate-500 mb-5">Your consultation has been confirmed.</p>
                    {bookedConsultation && (
                      <div className="bg-slate-50 rounded-xl p-4 mb-5 text-left border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Booking Reference</p>
                        <p className="text-xs text-slate-600 mb-1">ID: <span className="font-mono font-semibold">{String(bookedConsultation.id).slice(0, 20)}...</span></p>
                        <p className="text-xs text-slate-600 mb-1">Date: <span className="font-semibold">{String(bookedConsultation.date)}</span></p>
                        <p className="text-xs text-slate-600 mb-1">Time: <span className="font-semibold">{String(bookedConsultation.time)}</span></p>
                        <div className="mt-3 p-2 bg-sky-50 border border-sky-200 rounded-lg">
                          <p className="text-xs text-sky-700 font-medium">Meeting Link:</p>
                          <a
                            href={String(bookedConsultation.meetingLink)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-sky-600 font-mono break-all underline"
                          >
                            {String(bookedConsultation.meetingLink)}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { closeModal(); navigate("/dashboard"); }}
                        className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-xl text-sm"
                      >
                        View Dashboard
                      </button>
                      <button onClick={closeModal} className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50">
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
