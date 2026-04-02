import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Upload, FileText, X, CheckCircle, Loader2, FileScan, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  rawFile: File;
  category: string;
  notes: string;
  status: "uploading" | "success" | "error";
}

interface AnalysisResult {
  summary: string;
  risk_level: string;
  recommendations: string[];
  citations: Array<{ source?: string; title?: string; url?: string }>;
}

const CATEGORIES = [
  "Blood Test", "X-Ray", "MRI/CT Scan", "Ultrasound",
  "ECG/Echo", "Prescription", "Discharge Summary", "Other",
];

export function HealthReportUpload({ compact = false }: { compact?: boolean }) {
  const { user, apiCall } = useAuth();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Blood Test");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analysisByFile, setAnalysisByFile] = useState<Record<string, AnalysisResult>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!user) { toast.error("Please login to upload health reports"); navigate("/auth"); return; }
    processFiles(e.dataTransfer.files);
  };

  const processFiles = (files: FileList) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Unsupported format. Use PDF or images.`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: File too large. Max 20MB.`);
        return;
      }
      newFiles.push({ name: file.name, size: file.size, type: file.type, rawFile: file, category: selectedCategory, notes, status: "uploading" });
    });

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) { toast.error("Please login to upload"); navigate("/auth"); return; }
    if (e.target.files) processFiles(e.target.files);
  };

  const uploadFiles = async () => {
    if (!user) { toast.error("Please login first"); navigate("/auth"); return; }
    if (uploadedFiles.length === 0) { toast.error("Please select files to upload"); return; }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of uploadedFiles) {
      if (file.status === "success") continue;
      try {
        const form = new FormData();
        form.append("file", file.rawFile);
        form.append("context", `${file.category}. Notes: ${file.notes || "N/A"}`);

        const res = await apiCall("/reports/upload-analysis", {
          method: "POST",
          body: form,
        });

        const responseData = await res.json();
        
        if (res.ok) {
          setUploadedFiles((prev) =>
            prev.map((f) => f.name === file.name ? { ...f, status: "success" } : f)
          );
          setAnalysisByFile((prev) => ({
            ...prev,
            [file.name]: {
              summary: responseData.summary || "",
              risk_level: responseData.risk_level || "unknown",
              recommendations: responseData.recommendations || [],
              citations: responseData.citations || [],
            },
          }));
          successCount++;
          toast.success(`${file.name} analyzed successfully!`);
        } else {
          errorCount++;
          setUploadedFiles((prev) =>
            prev.map((f) => f.name === file.name ? { ...f, status: "error" } : f)
          );
          toast.error(`Failed to upload ${file.name}: ${responseData.error || "Unknown error"}`);
        }
      } catch (err) {
        errorCount++;
        setUploadedFiles((prev) =>
          prev.map((f) => f.name === file.name ? { ...f, status: "error" } : f)
        );
        console.error(`Upload error for ${file.name}:`, err);
        toast.error(`Error uploading ${file.name}: ${err instanceof Error ? err.message : "Network error"}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} report(s) uploaded successfully!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} report(s) failed to upload. Please try again.`);
    }
  };

  const removeFile = (name: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
    setAnalysisByFile((prev) => {
      const cloned = { ...prev };
      delete cloned[name];
      return cloned;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={compact ? "" : "bg-white rounded-3xl shadow-xl border border-slate-100 p-6 lg:p-8"}>
      {!compact && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center">
            <FileScan className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Upload Health Reports
            </h2>
            <p className="text-slate-500 text-sm">Securely upload your medical documents</p>
          </div>
        </div>
      )}

      {/* Category & Notes */}
      {uploadedFiles.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Report Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Fasting blood test"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
            />
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-sky-400 bg-sky-50 scale-[1.01]"
            : "border-slate-300 hover:border-sky-400 hover:bg-sky-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            dragOver ? "bg-sky-100 scale-110" : "bg-slate-100"
          }`}>
            <Upload className={`w-7 h-7 ${dragOver ? "text-sky-500" : "text-slate-400"}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-700">
              Drop files here or <span className="text-sky-500">browse</span>
            </p>
            <p className="text-slate-400 text-sm mt-1">PDF, JPG, PNG up to 20MB each</p>
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-500" /> 256-bit encrypted</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-sky-500" /> Instant AI analysis</span>
          </div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 space-y-2"
          >
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(file.size)} · {file.category}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.status === "uploading" && <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>}
                  {file.status === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {file.status === "error" && <X className="w-5 h-5 text-red-500" />}
                  {file.status !== "success" && (
                    <button onClick={() => removeFile(file.name)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {Object.entries(analysisByFile).length > 0 && (
        <div className="mt-4 space-y-3">
          {Object.entries(analysisByFile).map(([fileName, analysis]) => (
            <div key={fileName} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-sm font-semibold text-slate-900">Analysis: {fileName}</p>
              <p className="text-xs mt-1 text-slate-600">Risk: <span className="font-semibold uppercase">{analysis.risk_level}</span></p>
              <p className="text-sm mt-2 text-slate-700 whitespace-pre-wrap">{analysis.summary}</p>
              {analysis.recommendations.length > 0 && (
                <ul className="mt-2 text-xs text-slate-700 list-disc list-inside space-y-1">
                  {analysis.recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
                </ul>
              )}
              {analysis.citations.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-600">Trusted Sources:</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {analysis.citations.slice(0, 4).map((c, idx) => (
                      <a
                        key={idx}
                        href={c.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-2 py-1 rounded-full bg-white border border-slate-200 text-sky-700 hover:bg-sky-50"
                      >
                        {c.source || c.title || "source"}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {uploadedFiles.length > 0 && uploadedFiles.some((f) => f.status !== "success") && (
        <button
          onClick={uploadFiles}
          disabled={uploading}
          className="mt-4 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload {uploadedFiles.filter((f) => f.status !== "success").length} Report(s)</>
          )}
        </button>
      )}

      {uploadedFiles.every((f) => f.status === "success") && uploadedFiles.length > 0 && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-700 text-sm font-medium">All reports uploaded successfully!</span>
        </div>
      )}
    </div>
  );
}
