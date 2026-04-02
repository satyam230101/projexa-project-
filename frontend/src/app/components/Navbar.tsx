import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Menu, X, ChevronDown, User, LogOut, LayoutDashboard,
  Stethoscope, Shield, Phone, Info, Home, Video, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Only use transparent/white-text navbar on homepage before scrolling
  const isTransparent = !scrolled && location.pathname === "/";
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getDashboardPath = () => {
    if (!user) return "/auth";
    if (user.role === "admin") return "/admin";
    if (user.role === "doctor") return "/doctor/dashboard";
    return "/dashboard";
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/consultation", label: "Consultation", icon: Video },
    { to: "/about", label: "About", icon: Info },
    { to: "/contact", label: "Contact", icon: Phone },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        !isTransparent
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-blue-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 lg:w-12 lg:h-12">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 opacity-80"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4C9.373 4 4 9.373 4 16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16C28 9.373 22.627 4 16 4Z" fill="white" fillOpacity="0.2"/>
                  <path d="M14 10H18V14H22V18H18V22H14V18H10V14H14V10Z" fill="white"/>
                  <circle cx="23" cy="9" r="3" fill="#34d399"/>
                </svg>
              </div>
            </div>
            <div>
              <span
                className={`text-xl lg:text-2xl font-bold tracking-tight transition-colors ${
                  !isTransparent ? "text-slate-900" : "text-white"
                }`}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Medi<span className="text-sky-400">+</span>
              </span>
              <p className={`text-[10px] leading-none transition-colors ${!isTransparent ? "text-slate-500" : "text-sky-200"}`}>
                AI Healthcare
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? "bg-sky-500/20 text-sky-400"
                    : !isTransparent
                    ? "text-slate-600 hover:text-sky-600 hover:bg-sky-50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    !isTransparent
                      ? "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                      : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                    >
                      <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-slate-100">
                        <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role} Account</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => { navigate(getDashboardPath()); setDropdownOpen(false); }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </button>
                        <button
                          onClick={() => { navigate(getDashboardPath() + "#profile"); setDropdownOpen(false); }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </button>
                        {user.role === "admin" && (
                          <button
                            onClick={() => { navigate("/admin"); setDropdownOpen(false); }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </button>
                        )}
                        <hr className="my-1 border-slate-100" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/auth")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    !isTransparent
                      ? "text-slate-600 hover:text-sky-600"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth?mode=register")}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              !isTransparent ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
            }`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 shadow-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(to)
                      ? "bg-sky-50 text-sky-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-sky-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <hr className="border-slate-100 my-2" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-sky-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(getDashboardPath())}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-xl"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full py-3 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("/auth?mode=register")}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold rounded-xl"
                  >
                    Get Started Free
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}