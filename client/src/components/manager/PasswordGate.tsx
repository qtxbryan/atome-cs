import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PasswordGate() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(password);
    if (!ok) {
      setError("Incorrect password");
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800">
        <div className="mb-6 text-center">
          <span className="inline-block text-3xl font-black tracking-tight text-atome">
            atome
          </span>
          <p className="mt-2 text-zinc-400 text-sm">Manager Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-atome/50 focus:border-atome"
              placeholder="Enter password"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-atome text-black font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
