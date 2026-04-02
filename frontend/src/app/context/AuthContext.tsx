import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiUrl } from "../../config/api";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "patient" | "doctor" | "user" | "admin";
  phone?: string;
  specialty?: string;
  qualifications?: string;
  experience?: string;
  bio?: string;
  rating?: number;
  consultations?: number;
  available?: boolean;
  fee?: number;
  verified?: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: RegisterData) => Promise<{ error?: string; message?: string }>;
  verifySignupOtp: (email: string, otp: string) => Promise<{ error?: string }>;
  startForgotPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  verifyForgotPasswordOtp: (email: string, otp: string) => Promise<{ error?: string; resetToken?: string }>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  apiCall: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: "patient" | "doctor" | "user";
  phone?: string;
  specialty?: string;
  qualifications?: string;
  experience?: string;
  bio?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveToken = (token: string | null) => {
    setAccessToken(token);
    if (token) localStorage.setItem("access_token", token);
    else localStorage.removeItem("access_token");
  };

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(apiUrl("/user/profile"), {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      saveToken(token);
      fetchProfile(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(apiUrl("/auth/signin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let errorDetail = "Login failed";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            errorDetail = data.detail || data.error || errorDetail;
          } else {
            errorDetail = `Server error: ${res.status} ${res.statusText}`;
          }
        } catch (_) {
          errorDetail = `Server returned invalid response (${res.status})`;
        }
        return { error: errorDetail };
      }

      const data = await res.json();

      saveToken(data.access_token);
      await fetchProfile(data.access_token);
      return {};
    } catch (err) {
      return { error: `Login failed: ${err}` };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const res = await fetch(apiUrl("/auth/signup/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      if (!res.ok) {
        let errorDetail = "Registration failed";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            errorDetail = data.detail || data.error || errorDetail;
          } else {
            errorDetail = `Server error: ${res.status} ${res.statusText}`;
          }
        } catch (_) {
          errorDetail = `Server returned invalid response (${res.status})`;
        }
        return { error: errorDetail };
      }
      const data = await res.json();
      return { message: data.message || "OTP sent to your email" };
    } catch (err) {
      return { error: `Registration error: ${err}` };
    }
  };

  const verifySignupOtp = async (email: string, otp: string) => {
    try {
      const res = await fetch(apiUrl("/auth/signup/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!res.ok) {
        let errorDetail = "OTP verification failed";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            errorDetail = data.detail || data.error || errorDetail;
          } else {
            errorDetail = `Server error: ${res.status} ${res.statusText}`;
          }
        } catch (_) {
          errorDetail = `Server returned invalid response (${res.status})`;
        }
        return { error: errorDetail };
      }
      const data = await res.json();

      saveToken(data.access_token);
      await fetchProfile(data.access_token);
      return {};
    } catch (err) {
      return { error: `OTP verification failed: ${err}` };
    }
  };

  const startForgotPassword = async (email: string) => {
    try {
      const res = await fetch(apiUrl("/auth/forgot-password/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        let errorDetail = "Failed to send OTP";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            errorDetail = data.detail || data.error || errorDetail;
          } else {
            errorDetail = `Server error: ${res.status} ${res.statusText}`;
          }
        } catch (_) {
          errorDetail = `Server returned invalid response (${res.status})`;
        }
        return { error: errorDetail };
      }
      const data = await res.json();
      return { message: data.message || "OTP sent" };
    } catch (err) {
      return { error: `Failed to send OTP: ${err}` };
    }
  };

  const verifyForgotPasswordOtp = async (email: string, otp: string) => {
    try {
      const res = await fetch(apiUrl("/auth/forgot-password/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!res.ok) {
        let errorDetail = "Invalid OTP";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            errorDetail = data.detail || data.error || errorDetail;
          } else {
            errorDetail = `Server error: ${res.status} ${res.statusText}`;
          }
        } catch (_) {
          errorDetail = `Server returned invalid response (${res.status})`;
        }
        return { error: errorDetail };
      }
      const data = await res.json();
      return { resetToken: data.reset_token };
    } catch (err) {
      return { error: `OTP verification failed: ${err}` };
    }
  };

  const resetPassword = async (resetToken: string, newPassword: string) => {
    try {
      const res = await fetch(apiUrl("/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });

      if (!res.ok) {
        let errorDetail = "Reset password failed";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            errorDetail = data.detail || data.error || errorDetail;
          } else {
            errorDetail = `Server error: ${res.status} ${res.statusText}`;
          }
        } catch (_) {
          errorDetail = `Server returned invalid response (${res.status})`;
        }
        return { error: errorDetail };
      }
      const data = await res.json();
      return {};
    } catch (err) {
      return { error: `Reset password failed: ${err}` };
    }
  };

  const logout = async () => {
    setUser(null);
    saveToken(null);
  };

  const refreshProfile = async () => {
    if (accessToken) await fetchProfile(accessToken);
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = accessToken;
    const isFormData = options.body instanceof FormData;
    const baseHeaders: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (!isFormData) {
      baseHeaders["Content-Type"] = "application/json";
    }

    return fetch(apiUrl(endpoint), {
      ...options,
      headers: {
        ...baseHeaders,
        ...options.headers,
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        verifySignupOtp,
        startForgotPassword,
        verifyForgotPasswordOtp,
        resetPassword,
        logout,
        refreshProfile,
        apiCall,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}