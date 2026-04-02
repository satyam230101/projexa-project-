import { Link } from "react-router";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 10H18V14H22V18H18V22H14V18H10V14H14V10Z" fill="white"/>
                  <circle cx="23" cy="9" r="3" fill="#34d399"/>
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Medi<span className="text-sky-400">+</span>
                </span>
                <p className="text-xs text-slate-400">AI Healthcare</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Revolutionizing healthcare access through AI-powered telemedicine. Quality care, anytime and anywhere.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Youtube, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 bg-slate-800 hover:bg-sky-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Home", to: "/" },
                { label: "Find Doctors", to: "/consultation" },
                { label: "About Us", to: "/about" },
                { label: "Contact", to: "/contact" },
                { label: "AI Health Chat", to: "/#ai-chat" },
                { label: "Health Reports", to: "/dashboard" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-slate-400 hover:text-sky-400 text-sm transition-colors"
                  >
                    → {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="font-semibold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Specialties</h3>
            <ul className="space-y-2.5">
              {[
                "Cardiology", "Pediatrics", "Neurology", "Dermatology",
                "Orthopedics", "Gynecology", "General Medicine", "Psychiatry",
              ].map((spec) => (
                <li key={spec}>
                  <Link
                    to={`/consultation?specialty=${spec}`}
                    className="text-slate-400 hover:text-sky-400 text-sm transition-colors"
                  >
                    → {spec}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-sky-400" />
                </div>
                <span className="text-slate-400 text-sm">
                  12th Floor, Cyber Hub,<br/>Gurugram, Haryana 122002
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-sky-400" />
                </div>
                <a href="tel:+918001234567" className="text-slate-400 hover:text-sky-400 text-sm transition-colors">
                  +91 800 123 4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-sky-400" />
                </div>
                <a href="mailto:care@mediplus.health" className="text-slate-400 hover:text-sky-400 text-sm transition-colors">
                  care@mediplus.health
                </a>
              </li>
            </ul>

            <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 text-xs font-semibold mb-1">🟢 24/7 Emergency Support</p>
              <p className="text-slate-400 text-xs">Emergency Helpline: <span className="text-white font-semibold">1800-MEDI-911</span></p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> by Medi+ Team © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "HIPAA Compliance"].map((item) => (
              <a key={item} href="#" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
