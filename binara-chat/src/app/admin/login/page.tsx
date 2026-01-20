"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("secret");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("binara_admin_token");
    if (token) router.replace("/admin");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Login gagal (${res.status})`);
      }

      const data = await res.json();
      const token = data.token || data.access_token;
      if (!token) throw new Error("Token tidak ditemukan di response backend.");

      localStorage.setItem("binara_admin_token", token);
      router.replace("/admin");
    } catch (e: any) {
      setErr(e?.message ?? "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07070b] d-flex items-center justify-center">
      {/* BACKGROUND: sama vibe-nya kayak chatbot */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -right-40 -bottom-40 h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      <div className="mx-auto h-screen items-center flex w-full max-w-6xl justify-center">
        <div className="w-full max-w-[520px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <div className="text-base font-semibold text-white">
                Masuk sebagai Admin
              </div>
            </div>

            <div className="mb-5 text-sm text-white/65">
              Login untuk edit info kost, nomor WA, alamat, link maps, jam
              kunjungan.
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-white/60">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-indigo-400/40 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-indigo-400/40 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {err && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {err}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/10 ring-1 ring-white/10 transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? "Login..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
