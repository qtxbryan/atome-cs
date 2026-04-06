import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

interface Props {
  guidelines: string[];
  onChange: (guidelines: string[]) => void;
}

export default function GuidelinesEditor({ guidelines, onChange }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [newGuideline, setNewGuideline] = useState("");

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditText(guidelines[idx]);
  }

  function commitEdit(idx: number) {
    if (!editText.trim()) return;
    const updated = [...guidelines];
    updated[idx] = editText.trim();
    onChange(updated);
    setEditingIdx(null);
  }

  function cancelEdit() {
    setEditingIdx(null);
    setEditText("");
  }

  function deleteGuideline(idx: number) {
    onChange(guidelines.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  }

  function addGuideline() {
    const trimmed = newGuideline.trim();
    if (!trimmed) return;
    onChange([...guidelines, trimmed]);
    setNewGuideline("");
  }

  return (
    <div className="space-y-2">
      {guidelines.length === 0 && (
        <p className="text-zinc-500 text-sm italic py-2">
          No guidelines yet. Add one below.
        </p>
      )}

      {guidelines.map((g, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg p-3"
        >
          <span className="text-zinc-500 text-xs font-mono pt-0.5 shrink-0 w-5">
            {idx + 1}.
          </span>

          {editingIdx === idx ? (
            <div className="flex-1 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-atome/50 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => commitEdit(idx)}
                  className="flex items-center gap-1 text-xs bg-atome text-black font-semibold px-3 py-1.5 rounded-lg hover:opacity-90"
                >
                  <Check size={12} /> Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1.5"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="flex-1 text-zinc-200 text-sm leading-relaxed">{g}</p>
          )}

          {editingIdx !== idx && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => startEdit(idx)}
                className="p-1.5 text-zinc-500 hover:text-white rounded transition-colors"
                title="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => deleteGuideline(idx)}
                className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={newGuideline}
          onChange={(e) => setNewGuideline(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGuideline()}
          placeholder="Add a new guideline…"
          className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500"
        />
        <button
          onClick={addGuideline}
          disabled={!newGuideline.trim()}
          className="flex items-center gap-1 bg-zinc-700 text-white text-sm px-3 py-2 rounded-lg hover:bg-zinc-600 disabled:opacity-40 transition-colors"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
