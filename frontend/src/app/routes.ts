import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { ConsultationPage } from "./pages/ConsultationPage";
import { AuthPage } from "./pages/AuthPage";
import { VerifyOtpPage } from "./pages/VerifyOtpPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { UserDashboard } from "./pages/UserDashboard";
import { DoctorDashboard } from "./pages/DoctorDashboard";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "about", Component: AboutPage },
      { path: "contact", Component: ContactPage },
      { path: "consultation", Component: ConsultationPage },
      { path: "auth", Component: AuthPage },
      { path: "auth/verify", Component: VerifyOtpPage },
      { path: "auth/forgot-password", Component: ForgotPasswordPage },
      { path: "auth/reset-password", Component: ResetPasswordPage },
      { path: "dashboard", Component: UserDashboard },
      { path: "doctor/dashboard", Component: DoctorDashboard },
      { path: "admin", Component: AdminDashboard },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
