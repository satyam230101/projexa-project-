import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, MinusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

interface MedicineSuggestion {
  name?: string;
  usage?: string;
  dosage?: string;
  note?: string;
}

interface Citation {
  source?: string;
  title?: string;
  url?: string;
  snippet?: string;
  medicine_suggestions?: MedicineSuggestion[];
}

function getTopMedicines(citations: Citation[]): MedicineSuggestion[] {
  const byName = new Map<string, MedicineSuggestion>();

  citations.forEach((citation) => {
    if (!Array.isArray(citation.medicine_suggestions)) return;

    citation.medicine_suggestions.forEach((medicine) => {
      const normalizedName = (medicine.name || "").trim().toLowerCase();
      if (!normalizedName) return;

      const existing = byName.get(normalizedName);
      if (!existing) {
        byName.set(normalizedName, {
          name: medicine.name,
          usage: medicine.usage,
          dosage: medicine.dosage,
          note: medicine.note,
        });
        return;
      }

      byName.set(normalizedName, {
        name: existing.name || medicine.name,
        usage: existing.usage || medicine.usage,
        dosage: existing.dosage || medicine.dosage,
        note: existing.note || medicine.note,
      });
    });
  });

  return Array.from(byName.values()).slice(0, 6);
}

// Simple markdown-like renderer
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
          return <p key={i} className="font-bold text-slate-900">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-sky-500 mt-0.5">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line.startsWith("**") && line.includes("**")) {
          return <p key={i}>{renderInline(line)}</p>;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i} className="italic text-slate-600">{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function AIChat() {
  const { apiCall } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 **Hello! I'm MediBot**, your AI Health Assistant!\n\nI can help you with health information, symptoms, booking consultations, and more.\n\n*Type 'help' to see what I can do!*",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const sentInput = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await apiCall("/chat/agent", {
        method: "POST",
        body: JSON.stringify({ message: sentInput }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (!data.response) {
        throw new Error("No response from AI");
      }

      const citations: Citation[] = Array.isArray(data.citations) ? data.citations : [];

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        citations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection error";
      console.error("Chat error:", err);
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ Sorry, I encountered an error: ${errorMessage}\n\nPlease check your internet connection and try again.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = ["I have a fever", "Book consultation", "Headache symptoms", "Emergency help"];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ height: isMinimized ? "auto" : "560px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                    MediBot AI
                  </h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sky-100 text-xs">Online • Healthcare Assistant</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <MinusCircle className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === "assistant"
                            ? "bg-gradient-to-br from-sky-400 to-indigo-500"
                            : "bg-gradient-to-br from-emerald-400 to-teal-500"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Bot className="w-4 h-4 text-white" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                          msg.role === "assistant"
                            ? "bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-none"
                            : "bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-tr-none"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <>
                            <SimpleMarkdown text={msg.content} />
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {(() => {
                                  const topMedicines = getTopMedicines(msg.citations || []);

                                  if (topMedicines.length === 0) return null;

                                  return (
                                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5">
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                                        Top Recommended Medicines
                                      </p>
                                      <div className="mt-1.5 space-y-1">
                                        {topMedicines.map((medicine, topIdx) => (
                                          <p key={`${msg.id}-top-med-${topIdx}`} className="text-[11px] leading-relaxed text-emerald-900">
                                            <span className="font-medium">{medicine.name || "Medicine"}</span>
                                            {medicine.usage ? ` - ${medicine.usage}` : ""}
                                            {medicine.dosage ? ` | Dosage: ${medicine.dosage}` : ""}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {msg.citations.slice(0, 4).map((citation, idx) => (
                                  <div key={`${msg.id}-citation-${idx}`} className="rounded-xl border border-slate-200 bg-white p-2.5">
                                    <p className="text-[11px] font-semibold text-slate-800">
                                      {citation.title || "Trusted medical source"}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">{citation.source || "source"}</p>
                                    {citation.snippet && (
                                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-700">{citation.snippet}</p>
                                    )}

                                    {Array.isArray(citation.medicine_suggestions) && citation.medicine_suggestions.length > 0 && (
                                      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                                          Medicine Options
                                        </p>
                                        <div className="mt-1 space-y-1">
                                          {citation.medicine_suggestions.slice(0, 4).map((medicine, medIdx) => (
                                            <p key={`${msg.id}-citation-${idx}-med-${medIdx}`} className="text-[11px] leading-relaxed text-emerald-900">
                                              <span className="font-medium">{medicine.name || "Medicine"}</span>
                                              {medicine.usage ? ` - ${medicine.usage}` : ""}
                                              {medicine.dosage ? ` | Dosage: ${medicine.dosage}` : ""}
                                              {medicine.note ? ` | ${medicine.note}` : ""}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {citation.url && (
                                      <a
                                        href={citation.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-block text-[10px] font-medium text-sky-600 hover:text-sky-700"
                                      >
                                        Open source
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="leading-relaxed">{msg.content}</p>
                        )}
                        <p className={`text-[10px] mt-1.5 ${msg.role === "assistant" ? "text-slate-400" : "text-white/60"}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3">
                        <div className="flex gap-1.5 items-center">
                          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length <= 1 && (
                  <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                    {quickQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="text-xs px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-full hover:bg-sky-100 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                  <div className="flex gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about symptoms, doctors, health tips..."
                      rows={1}
                      className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                      style={{ maxHeight: "80px" }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || loading}
                      className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">
                    ⚕️ MediBot provides general info only. Consult a doctor for medical advice.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl shadow-2xl shadow-sky-500/40 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-white" />
          </span>
        )}
      </motion.button>
    </div>
  );
}
