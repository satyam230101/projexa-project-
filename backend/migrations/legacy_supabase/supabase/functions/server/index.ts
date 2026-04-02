import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ─── Seed initial data ────────────────────────────────────────────────────────
async function seedInitialData() {
  // Seed admin user if not exists
  const adminCheck = await kv.get("email_index:admin@mediplus.com");
  if (!adminCheck) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin@mediplus.com",
      password: "Admin@123456",
      user_metadata: { name: "Admin", role: "admin" },
      email_confirm: true,
    });
    if (!error && data?.user) {
      await kv.set(`user_profile:${data.user.id}`, {
        id: data.user.id, email: "admin@mediplus.com", name: "Admin",
        role: "admin", createdAt: new Date().toISOString(),
      });
      await kv.set("email_index:admin@mediplus.com", data.user.id);
      console.log("Admin user seeded");
    }
  }

  // Seed sample doctors
  const doctorsListRaw = await kv.get("doctors_list");
  if (!doctorsListRaw) {
    const sampleDoctors = [
      { id: "doc1", name: "Dr. Arjun Sharma", specialty: "Cardiologist", experience: "15 years", rating: 4.9, available: true, fee: 800, image: "https://images.unsplash.com/photo-1699883430258-785510b807db?w=400", bio: "Expert in heart diseases and cardiovascular health.", qualifications: "MBBS, MD Cardiology, AIIMS Delhi", languages: ["English", "Hindi"], consultations: 2450 },
      { id: "doc2", name: "Dr. Priya Menon", specialty: "Pediatrician", experience: "12 years", rating: 4.8, available: true, fee: 600, image: "https://images.unsplash.com/photo-1628320645101-5a41b1f88c0b?w=400", bio: "Specialized in child health and development.", qualifications: "MBBS, MD Pediatrics, JIPMER", languages: ["English", "Malayalam", "Tamil"], consultations: 1890 },
      { id: "doc3", name: "Dr. Rahul Verma", specialty: "Neurologist", experience: "18 years", rating: 4.9, available: false, fee: 1000, image: "https://images.unsplash.com/photo-1659353887019-b142198f2668?w=400", bio: "Expert in neurological disorders and brain health.", qualifications: "MBBS, DM Neurology, PGI Chandigarh", languages: ["English", "Hindi", "Punjabi"], consultations: 3200 },
      { id: "doc4", name: "Dr. Sneha Reddy", specialty: "Dermatologist", experience: "10 years", rating: 4.7, available: true, fee: 700, image: "https://images.unsplash.com/photo-1757125736482-328a3cdd9743?w=400", bio: "Specialist in skin, hair and nail conditions.", qualifications: "MBBS, MD Dermatology, Osmania Medical College", languages: ["English", "Telugu", "Hindi"], consultations: 1650 },
      { id: "doc5", name: "Dr. Anil Kumar", specialty: "Orthopedic Surgeon", experience: "20 years", rating: 4.8, available: true, fee: 900, image: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?w=400", bio: "Expert in bone, joint and muscle disorders.", qualifications: "MBBS, MS Orthopedics, KEM Hospital", languages: ["English", "Hindi", "Marathi"], consultations: 4100 },
      { id: "doc6", name: "Dr. Lakshmi Nair", specialty: "Gynecologist", experience: "14 years", rating: 4.9, available: true, fee: 750, image: "https://images.unsplash.com/photo-1758202292826-c40e172eed1c?w=400", bio: "Expert in women's health and reproductive medicine.", qualifications: "MBBS, MS Obstetrics & Gynecology, Calicut Medical College", languages: ["English", "Malayalam", "Hindi"], consultations: 2780 },
    ];
    await kv.set("doctors_list", sampleDoctors);
    console.log("Sample doctors seeded");
  }

  // Seed storage bucket
  const supabase = getSupabaseAdmin();
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketName = "make-21d26442-health-reports";
  const bucketExists = buckets?.some(b => b.name === bucketName);
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
    console.log("Storage bucket created");
  }
}

seedInitialData().catch(console.error);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/make-server-21d26442/health", (c) => c.json({ status: "ok", service: "Medi+ API" }));

// ─── Auth: Register ───────────────────────────────────────────────────────────
app.post("/make-server-21d26442/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role, phone, specialty, qualifications, experience, bio } = body;

    if (!email || !password || !name || !role) {
      return c.json({ error: "Missing required fields: email, password, name, role" }, 400);
    }
    if (!["patient", "doctor", "user"].includes(role)) {
      return c.json({ error: "Invalid role. Must be patient, doctor, or user" }, 400);
    }

    // Check if email already registered
    const existingUser = await kv.get(`email_index:${email.toLowerCase()}`);
    if (existingUser) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true,
    });

    if (error) {
      console.log("Registration error:", error);
      return c.json({ error: `Registration failed: ${error.message}` }, 400);
    }

    const userId = data.user.id;
    const now = new Date().toISOString();

    const userProfile: Record<string, unknown> = {
      id: userId, email: email.toLowerCase(), name, role, phone: phone || null,
      createdAt: now, updatedAt: now, isActive: true,
    };

    if (role === "doctor") {
      userProfile.specialty = specialty || null;
      userProfile.qualifications = qualifications || null;
      userProfile.experience = experience || null;
      userProfile.bio = bio || null;
      userProfile.rating = 0;
      userProfile.consultations = 0;
      userProfile.available = false;
      userProfile.fee = 500;
      userProfile.verified = false;
    }

    await kv.set(`user_profile:${userId}`, userProfile);
    await kv.set(`email_index:${email.toLowerCase()}`, userId);

    // If doctor, add to doctors list (pending verification)
    if (role === "doctor") {
      const doctorsList = (await kv.get("doctors_list") as unknown[]) || [];
      doctorsList.push({ ...userProfile, id: userId });
      await kv.set("doctors_list", doctorsList);
    }

    // Update stats
    const stats = (await kv.get("app_stats") as Record<string, number>) || { totalUsers: 0, totalPatients: 0, totalDoctors: 0, totalConsultations: 0, totalReports: 0 };
    stats.totalUsers = (stats.totalUsers || 0) + 1;
    if (role === "patient") stats.totalPatients = (stats.totalPatients || 0) + 1;
    if (role === "doctor") stats.totalDoctors = (stats.totalDoctors || 0) + 1;
    await kv.set("app_stats", stats);

    return c.json({ success: true, userId, message: "Registration successful" }, 201);
  } catch (err) {
    console.log("Register error:", err);
    return c.json({ error: `Server error during registration: ${err}` }, 500);
  }
});

// ─── Get user profile ─────────────────────────────────────────────────────────
app.get("/make-server-21d26442/user/profile", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const profile = await kv.get(`user_profile:${user.id}`);
    if (!profile) return c.json({ error: "Profile not found" }, 404);

    return c.json({ profile });
  } catch (err) {
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

// ─── Update user profile ──────────────────────────────────────────────────────
app.put("/make-server-21d26442/user/profile", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const existing = (await kv.get(`user_profile:${user.id}`)) as Record<string, unknown>;
    if (!existing) return c.json({ error: "Profile not found" }, 404);

    const updated = { ...existing, ...body, id: user.id, updatedAt: new Date().toISOString() };
    await kv.set(`user_profile:${user.id}`, updated);

    return c.json({ success: true, profile: updated });
  } catch (err) {
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

// ─── Doctors ──────────────────────────────────────────────────────────────────
app.get("/make-server-21d26442/doctors", async (c) => {
  try {
    const specialty = c.req.query("specialty");
    const available = c.req.query("available");
    let doctors = (await kv.get("doctors_list") as unknown[]) || [];

    if (specialty && specialty !== "all") {
      doctors = (doctors as Record<string, unknown>[]).filter((d) =>
        String(d.specialty || "").toLowerCase().includes(specialty.toLowerCase())
      );
    }
    if (available === "true") {
      doctors = (doctors as Record<string, unknown>[]).filter((d) => d.available === true);
    }

    return c.json({ doctors });
  } catch (err) {
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

// ─── Book Consultation ────────────────────────────────────────────────────────
app.post("/make-server-21d26442/consultations", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { doctorId, doctorName, specialty, date, time, type, symptoms, notes } = body;

    if (!doctorId || !date || !time) {
      return c.json({ error: "Missing required fields: doctorId, date, time" }, 400);
    }

    const consultId = `consult_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userProfile = (await kv.get(`user_profile:${user.id}`)) as Record<string, unknown>;

    const consultation = {
      id: consultId, patientId: user.id,
      patientName: userProfile?.name || "Unknown Patient",
      patientEmail: user.email,
      doctorId, doctorName, specialty,
      date, time, type: type || "video",
      symptoms: symptoms || null, notes: notes || null,
      status: "confirmed", meetingLink: `https://meet.mediplus.care/${consultId}`,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`consultation:${consultId}`, consultation);

    // Add to patient's consultations
    const patientConsults = (await kv.get(`consultations_patient:${user.id}`) as string[]) || [];
    patientConsults.unshift(consultId);
    await kv.set(`consultations_patient:${user.id}`, patientConsults);

    // Add to doctor's consultations
    const doctorConsults = (await kv.get(`consultations_doctor:${doctorId}`) as string[]) || [];
    doctorConsults.unshift(consultId);
    await kv.set(`consultations_doctor:${doctorId}`, doctorConsults);

    // Update stats
    const stats = (await kv.get("app_stats") as Record<string, number>) || {};
    stats.totalConsultations = (stats.totalConsultations || 0) + 1;
    await kv.set("app_stats", stats);

    return c.json({ success: true, consultation }, 201);
  } catch (err) {
    console.log("Book consultation error:", err);
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

// ─── Get user's consultations ─────────────────────────────────────────────────
app.get("/make-server-21d26442/consultations/my", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const consultIds = (await kv.get(`consultations_patient:${user.id}`) as string[]) || [];
    const consultations = await kv.mget(consultIds.map(id => `consultation:${id}`));

    return c.json({ consultations: consultations.filter(Boolean) });
  } catch (err) {
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

// ─── Health Reports ───────────────────────────────────────────────────────────
app.post("/make-server-21d26442/health-reports", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { fileName, fileType, fileSize, category, notes } = body;

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userProfile = (await kv.get(`user_profile:${user.id}`)) as Record<string, unknown>;

    const report = {
      id: reportId, userId: user.id,
      userName: userProfile?.name || "Unknown",
      fileName, fileType, fileSize,
      category: category || "General",
      notes: notes || null,
      status: "uploaded",
      uploadedAt: new Date().toISOString(),
    };

    await kv.set(`health_report:${reportId}`, report);

    const userReports = (await kv.get(`health_reports_user:${user.id}`) as string[]) || [];
    userReports.unshift(reportId);
    await kv.set(`health_reports_user:${user.id}`, userReports);

    const stats = (await kv.get("app_stats") as Record<string, number>) || {};
    stats.totalReports = (stats.totalReports || 0) + 1;
    await kv.set("app_stats", stats);

    return c.json({ success: true, report }, 201);
  } catch (err) {
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

app.get("/make-server-21d26442/health-reports/my", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const reportIds = (await kv.get(`health_reports_user:${user.id}`) as string[]) || [];
    const reports = await kv.mget(reportIds.map(id => `health_report:${id}`));

    return c.json({ reports: reports.filter(Boolean) });
  } catch (err) {
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

// ─── AI Chat ──────────────────────────────────────────────────────────────────
app.post("/make-server-21d26442/ai/chat", async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;
    if (!message) return c.json({ error: "Message is required" }, 400);

    const msg = message.toLowerCase();
    let response = "";

    if (msg.includes("fever") || msg.includes("temperature")) {
      response = "**Fever (Pyrexia)** is a common symptom indicating your body is fighting an infection. For adults, a temperature above 100.4°F (38°C) is considered a fever.\n\n**Immediate steps:**\n• Stay hydrated — drink plenty of fluids\n• Rest and avoid strenuous activity\n• Use antipyretics like Paracetamol (as directed)\n• Apply a cool, damp cloth to your forehead\n\n**Consult a doctor if:**\n• Fever exceeds 103°F (39.4°C)\n• Lasts more than 3 days\n• Accompanied by stiff neck, rash, or confusion\n\n⚕️ *I recommend booking a consultation with one of our doctors for proper evaluation.*";
    } else if (msg.includes("headache") || msg.includes("migraine")) {
      response = "**Headaches** can range from tension headaches to migraines and may have various causes.\n\n**Common triggers:**\n• Dehydration or hunger\n• Stress and poor sleep\n• Eye strain from screens\n• Hormonal changes\n\n**Self-care tips:**\n• Drink water and rest in a quiet, dark room\n• Over-the-counter pain relievers can help\n• Apply a cold or warm compress\n• Practice relaxation techniques\n\n**Seek immediate care if:**\n• Sudden, severe \"thunderclap\" headache\n• Headache with fever, stiff neck, or vision changes\n• Head injury preceded the headache\n\n⚕️ *For recurring headaches, I recommend consulting a neurologist on our platform.*";
    } else if (msg.includes("diabetes") || msg.includes("blood sugar")) {
      response = "**Diabetes** is a chronic condition affecting how your body processes blood sugar (glucose).\n\n**Key information:**\n• Type 1: Autoimmune — body doesn't produce insulin\n• Type 2: Body doesn't use insulin effectively (most common)\n• Gestational: Occurs during pregnancy\n\n**Warning signs:**\n• Frequent urination and increased thirst\n• Unexplained weight loss\n• Fatigue and blurred vision\n• Slow-healing wounds\n\n**Management:**\n• Regular blood glucose monitoring\n• Balanced diet and regular exercise\n• Medications as prescribed\n• Regular HbA1c checks\n\n⚕️ *Please consult our endocrinologists for personalized diabetes management plans.*";
    } else if (msg.includes("blood pressure") || msg.includes("hypertension") || msg.includes("bp")) {
      response = "**Blood Pressure** measures the force of blood against artery walls. Normal BP is below 120/80 mmHg.\n\n**Categories:**\n• Normal: < 120/80 mmHg\n• Elevated: 120-129 / < 80 mmHg\n• High (Stage 1): 130-139 / 80-89 mmHg\n• High (Stage 2): ≥ 140 / ≥ 90 mmHg\n\n**Lifestyle modifications:**\n• Reduce sodium intake\n• Regular aerobic exercise (150 min/week)\n• Maintain healthy weight\n• Limit alcohol and quit smoking\n• Manage stress\n\n⚕️ *Our cardiologists can create a personalized hypertension management plan for you.*";
    } else if (msg.includes("cold") || msg.includes("cough") || msg.includes("flu")) {
      response = "**Cold & Flu** are common respiratory infections caused by viruses.\n\n**Cold symptoms:** Runny nose, sneezing, mild cough, sore throat\n**Flu symptoms:** High fever, body aches, fatigue, severe cough\n\n**Home remedies:**\n• Rest and stay hydrated\n• Honey and ginger tea for sore throat\n• Steam inhalation for congestion\n• Saline nasal drops\n\n**When to see a doctor:**\n• Symptoms worsen after 7-10 days\n• High fever (>103°F) or difficulty breathing\n• Chest pain or confusion\n• At-risk groups (elderly, children, immunocompromised)\n\n⚕️ *Book a quick teleconsultation — our doctors can assess your symptoms within minutes!*";
    } else if (msg.includes("appointment") || msg.includes("book") || msg.includes("consult")) {
      response = "**Booking a consultation on Medi+** is quick and easy! 🏥\n\n**Steps to book:**\n1. Go to **Doctor Consultation** section\n2. Browse doctors by specialty\n3. Select your preferred doctor\n4. Choose available date and time\n5. Confirm your appointment\n\n**Consultation types available:**\n• 📹 Video Consultation (recommended)\n• 💬 Chat Consultation\n• 📞 Phone Consultation\n\n**Our specialties include:**\nCardiology, Pediatrics, Neurology, Dermatology, Orthopedics, Gynecology, General Medicine, and more!\n\n*Average wait time: < 15 minutes*\n*Available 24/7 for emergencies*";
    } else if (msg.includes("emergency") || msg.includes("urgent") || msg.includes("ambulance")) {
      response = "🚨 **MEDICAL EMERGENCY DETECTED**\n\nIf this is a life-threatening emergency, please:\n\n**Call immediately:**\n• **National Emergency:** 112\n• **Ambulance:** 108\n• **Disaster Management:** 1070\n\n**Emergency signs requiring immediate care:**\n• Chest pain or difficulty breathing\n• Stroke symptoms (FAST: Face drooping, Arm weakness, Speech difficulty, Time to call)\n• Severe bleeding or injuries\n• Unconsciousness\n• Severe allergic reaction\n\n⚠️ *Do not delay calling emergency services. Medi+ also has emergency doctors available 24/7 for immediate teleconsultation while waiting for ambulance.*";
    } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("help")) {
      response = "👋 **Hello! I'm MediBot, your AI Health Assistant!**\n\nI'm here to help you with:\n\n🏥 **Health Information**\n• Symptoms and conditions\n• Medication guidance\n• Preventive care tips\n\n📅 **Appointments**\n• Book doctor consultations\n• Find specialists\n• Check availability\n\n📊 **Health Reports**\n• Upload and manage reports\n• Get AI analysis insights\n\n**Sample questions you can ask:**\n• \"I have a fever, what should I do?\"\n• \"What are symptoms of diabetes?\"\n• \"How do I book an appointment?\"\n• \"I have a severe headache\"\n\n*Note: I provide general health information only. Always consult a qualified doctor for medical advice.*";
    } else if (msg.includes("report") || msg.includes("upload") || msg.includes("test")) {
      response = "**Health Report Upload on Medi+** 📄\n\n**Supported formats:**\n• PDF (Lab reports, prescriptions)\n• Images (JPG, PNG) for X-rays, scans\n• DICOM files (medical imaging)\n\n**Report categories:**\n• Blood Tests (CBC, LFT, KFT, Lipid Profile)\n• Radiology (X-Ray, MRI, CT Scan, Ultrasound)\n• Cardiology (ECG, Echo)\n• Pathology reports\n• Prescriptions\n\n**After upload, our AI can:**\n✅ Extract key values automatically\n✅ Highlight abnormal findings\n✅ Compare with normal ranges\n✅ Generate a summary report\n\n*Go to the **Health Reports** section in your dashboard to upload.*";
    } else if (msg.includes("cost") || msg.includes("fee") || msg.includes("price") || msg.includes("charge")) {
      response = "**Consultation Fees on Medi+** 💰\n\n**General Physicians:** ₹300 – ₹500\n**Specialists:** ₹600 – ₹1,200\n**Super Specialists:** ₹1,000 – ₹2,000\n\n**Packages Available:**\n• 🌟 Basic Plan: ₹299/month (2 consultations)\n• 💎 Premium Plan: ₹699/month (5 consultations)\n• 👑 Family Plan: ₹1,499/month (unlimited, 4 members)\n\n**Payment methods:**\n• UPI (PhonePe, GPay, Paytm)\n• Net Banking\n• Credit/Debit Cards\n• Health Insurance (25+ insurers supported)\n\n*First consultation FREE for new users!* 🎉";
    } else {
      response = `I understand you're asking about: **"${message}"**\n\n🤔 While I can provide general health information, this query requires more context.\n\n**I can help you with:**\n• Common symptoms and conditions\n• Medication information\n• Preventive health tips\n• Booking appointments\n• Understanding lab reports\n\n**For your specific concern, I recommend:**\n1. 📋 Describe your symptoms more specifically\n2. 👨‍⚕️ Book a consultation with our specialists\n3. 📞 Use our 24/7 helpline for urgent queries\n\n*Type "help" to see all available topics, or book a consultation for personalized medical advice.*\n\n⚕️ **Remember:** I provide general information only. Always consult a qualified healthcare professional for medical advice.`;
    }

    // Save chat to history if userId provided
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (token) {
      const supabase = getSupabaseAdmin();
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const chatHistory = (await kv.get(`chat_history:${user.id}`) as unknown[]) || [];
        chatHistory.push({ role: "user", message, timestamp: new Date().toISOString() });
        chatHistory.push({ role: "assistant", message: response, timestamp: new Date().toISOString() });
        if (chatHistory.length > 100) chatHistory.splice(0, chatHistory.length - 100);
        await kv.set(`chat_history:${user.id}`, chatHistory);
      }
    }

    return c.json({ response, timestamp: new Date().toISOString() });
  } catch (err) {
    return c.json({ error: `AI chat error: ${err}` }, 500);
  }
});

// ─── Contact Form ─────────────────────────────────────────────────────────────
app.post("/make-server-21d26442/contact", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, subject, message } = body;
    if (!name || !email || !message) return c.json({ error: "Missing required fields" }, 400);

    const contactId = `contact_${Date.now()}`;
    await kv.set(`contact:${contactId}`, {
      id: contactId, name, email, phone, subject, message,
      status: "new", createdAt: new Date().toISOString(),
    });

    const contacts = (await kv.get("contacts_list") as string[]) || [];
    contacts.unshift(contactId);
    await kv.set("contacts_list", contacts);

    return c.json({ success: true, message: "Message received! We'll get back to you within 24 hours." });
  } catch (err) {
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────
const requireAdmin = async (c: any, next: () => Promise<void>) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  const supabase = getSupabaseAdmin();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const profile = (await kv.get(`user_profile:${user.id}`)) as Record<string, unknown>;
  if (!profile || profile.role !== "admin") return c.json({ error: "Forbidden — Admin access required" }, 403);
  await next();
};

app.get("/make-server-21d26442/admin/stats", requireAdmin, async (c) => {
  try {
    const stats = (await kv.get("app_stats") as Record<string, number>) || {
      totalUsers: 0, totalPatients: 0, totalDoctors: 0, totalConsultations: 0, totalReports: 0,
    };
    const doctors = (await kv.get("doctors_list") as unknown[]) || [];
    const contacts = (await kv.get("contacts_list") as string[]) || [];

    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        consultations: Math.floor(Math.random() * 50) + 10,
        registrations: Math.floor(Math.random() * 20) + 5,
        reports: Math.floor(Math.random() * 30) + 8,
      };
    });

    return c.json({
      stats: { ...stats, totalDoctors: doctors.length, pendingContacts: contacts.length },
      weeklyData,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({ error: `Admin stats error: ${err}` }, 500);
  }
});

app.get("/make-server-21d26442/admin/users", requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) return c.json({ error: `Failed to list users: ${error.message}` }, 500);

    const usersWithProfiles = await Promise.all(
      (data.users || []).map(async (u) => {
        const profile = (await kv.get(`user_profile:${u.id}`)) as Record<string, unknown>;
        return { id: u.id, email: u.email, ...profile, createdAt: u.created_at };
      })
    );

    return c.json({ users: usersWithProfiles });
  } catch (err) {
    return c.json({ error: `Admin users error: ${err}` }, 500);
  }
});

app.get("/make-server-21d26442/admin/consultations", requireAdmin, async (c) => {
  try {
    const allKeys = await kv.getByPrefix("consultation:");
    return c.json({ consultations: allKeys || [] });
  } catch (err) {
    console.log("Admin consultations error:", err);
    return c.json({ error: `Admin consultations error: ${err}` }, 500);
  }
});

app.get("/make-server-21d26442/admin/reports", requireAdmin, async (c) => {
  try {
    const allReports = await kv.getByPrefix("health_report:");
    return c.json({ reports: allReports || [] });
  } catch (err) {
    console.log("Admin reports error:", err);
    return c.json({ error: `Admin reports error: ${err}` }, 500);
  }
});

app.get("/make-server-21d26442/admin/contacts", requireAdmin, async (c) => {
  try {
    const contactIds = (await kv.get("contacts_list") as string[]) || [];
    if (!Array.isArray(contactIds)) {
      return c.json({ contacts: [] });
    }
    const contacts = await kv.mget(contactIds.map(id => `contact:${id}`));
    return c.json({ contacts: contacts.filter(Boolean) });
  } catch (err) {
    console.log("Admin contacts error:", err);
    return c.json({ error: `Admin contacts error: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
