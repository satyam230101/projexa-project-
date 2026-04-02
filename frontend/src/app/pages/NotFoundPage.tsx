import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="text-9xl font-black text-slate-200 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>404</div>
        <div className="w-24 h-24 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 32 32" className="w-14 h-14" fill="none">
            <path d="M14 10H18V14H22V18H18V22H14V18H10V14H14V10Z" fill="white"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
          Page Not Found
        </h1>
        <p className="text-slate-500 text-lg mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Home className="w-5 h-5" /> Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
