import { useRef, useState, type DragEvent } from "react";
import { Upload, FileText, X } from "lucide-react";
import { uploadDocument } from "@/api/metaAgentApi";

interface Props {
  onContentLoaded: (content: string, filename: string) => void;
  onClear: () => void;
  filename: string | null;
}

export default function DocumentUpload({ onContentLoaded, onClear, filename }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { content } = await uploadDocument(file);
      onContentLoaded(content, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (filename) {
    return (
      <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5">
        <FileText size={16} className="text-atome shrink-0" />
        <span className="text-white text-sm flex-1 truncate">{filename}</span>
        <button
          onClick={onClear}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-atome bg-atome/5"
            : "border-zinc-700 hover:border-zinc-500"
        }`}
      >
        <Upload size={24} className="mx-auto text-zinc-500 mb-2" />
        <p className="text-zinc-400 text-sm">
          {uploading ? "Uploading…" : "Drop a PDF or TXT file here, or click to browse"}
        </p>
        <p className="text-zinc-600 text-xs mt-1">Supports .pdf and .txt</p>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
