import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AIChat } from "./AIChat";
import { useEffect } from "react";

export function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Don't show footer or navbar on auth page
  const hideFooter = location.pathname === "/auth";
  const hideNavbar = location.pathname === "/auth";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      {!hideNavbar && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
      <AIChat />
    </div>
  );
}