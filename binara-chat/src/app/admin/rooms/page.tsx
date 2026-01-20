"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Room = {
  id?: number;
  code: string;
  title?: string;
  price_monthly?: number | null;
  deposit?: number | null;
  size_m2?: number | null;
  facilities?: string | null;
  is_available: boolean;
};

export default function AdminRooms() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editing, setEditing] = useState<Room | null>(null);
  const [msg, setMsg] = useState<string>("");

  function token() {
    return typeof window !== "undefined"
      ? localStorage.getItem("binara_admin_token") || ""
      : "";
  }

  async function load() {
    setMsg("");
    const t = token();
    const res = await fetch(`${apiBase}/api/admin/rooms`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 401) return router.push("/admin/login");
    const data = await res.json();
    setRooms(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    const t = token();
    if (!t) router.push("/admin/login");
    load();
    // eslint-disable-next-line
  }, []);

  function startNew() {
    setEditing({
      code: "",
      title: "",
      price_monthly: null,
      deposit: null,
      size_m2: null,
      facilities: "",
      is_available: true,
    });
  }

  async function save() {
    if (!editing) return;
    setMsg("");
    const t = token();
    const isEdit = !!editing.id;

    const url = isEdit
      ? `${apiBase}/api/admin/rooms/${editing.id}`
      : `${apiBase}/api/admin/rooms`;

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(editing),
    });

    if (res.status === 401) return router.push("/admin/login");
    if (!res.ok) return setMsg("Gagal simpan. Cek field & backend log.");

    setMsg("✅ Tersimpan");
    setEditing(null);
    await load();
    setTimeout(() => setMsg(""), 1200);
  }

  async function del(id?: number) {
    if (!id) return;
    const t = token();
    const res = await fetch(`${apiBase}/api/admin/rooms/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 401) return router.push("/admin/login");
    await load();
  }

  return (
    <main className="min-h-screen bg-[#070713] text-white px-5 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">Kelola Kamar</div>
            <div className="text-white/60">Tambah / edit / hapus kamar</div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-2xl px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/15"
            >
              ← Back
            </Link>
            <button
              onClick={startNew}
              className="rounded-2xl px-4 py-2 bg-gradient-to-br from-fuchsia-500/85 to-indigo-500/85 border border-white/10"
            >
              + Tambah Kamar
            </button>
          </div>
        </div>

        {msg ? (
          <div className="mt-4 text-sm text-emerald-300">{msg}</div>
        ) : null}

        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          {/* LIST */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5">
            <div className="text-sm text-white/70 mb-3">Daftar kamar</div>
            <div className="space-y-3">
              {rooms.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold">
                      {r.title || r.code}{" "}
                      <span className="text-xs text-white/50">({r.code})</span>
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      Rp {Number(r.price_monthly || 0).toLocaleString("id-ID")}{" "}
                      / bulan • Deposit Rp{" "}
                      {Number(r.deposit || 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-xs mt-2">
                      <span
                        className={
                          r.is_available ? "text-emerald-300" : "text-rose-300"
                        }
                      >
                        {r.is_available ? "Tersedia" : "Penuh"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(r)}
                      className="rounded-xl px-3 py-2 bg-white/10 border border-white/10 hover:bg-white/15 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(r.id)}
                      className="rounded-xl px-3 py-2 bg-rose-500/15 border border-rose-500/20 hover:bg-rose-500/20 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
              {!rooms.length ? (
                <div className="text-white/50 text-sm">
                  Belum ada kamar. Klik “Tambah Kamar”.
                </div>
              ) : null}
            </div>
          </div>

          {/* EDIT FORM */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5">
            <div className="text-sm text-white/70 mb-3">
              {editing ? "Form kamar" : "Pilih kamar untuk edit / tambah baru"}
            </div>

            {!editing ? (
              <div className="text-white/50 text-sm">
                Klik Edit pada kamar, atau Tambah Kamar.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
                    placeholder="Code (misal A-01)"
                    value={editing.code}
                    onChange={(e) =>
                      setEditing({ ...editing, code: e.target.value })
                    }
                  />
                  <input
                    className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
                    placeholder="Title (opsional)"
                    value={editing.title ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
                    placeholder="Harga/bulan"
                    value={editing.price_monthly ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        price_monthly: Number(e.target.value || 0),
                      })
                    }
                    type="number"
                  />
                  <input
                    className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
                    placeholder="Deposit"
                    value={editing.deposit ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        deposit: Number(e.target.value || 0),
                      })
                    }
                    type="number"
                  />
                  <input
                    className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
                    placeholder="Luas m²"
                    value={editing.size_m2 ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        size_m2: Number(e.target.value || 0),
                      })
                    }
                    type="number"
                  />
                </div>

                <textarea
                  className="w-full min-h-[110px] rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
                  placeholder="Fasilitas (pisah koma). contoh: AC, WiFi, KM dalam"
                  value={editing.facilities ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, facilities: e.target.value })
                  }
                />

                <label className="flex items-center gap-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={editing.is_available}
                    onChange={(e) =>
                      setEditing({ ...editing, is_available: e.target.checked })
                    }
                  />
                  Tersedia
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={save}
                    className="rounded-2xl px-5 py-3 font-medium bg-gradient-to-br from-fuchsia-500/85 to-indigo-500/85 border border-white/10"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded-2xl px-5 py-3 bg-white/10 border border-white/10 hover:bg-white/15"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-white/45">
          Kamar yang di-set “Tersedia” bisa dipakai landing preview & chatbot
          context.
        </div>
      </div>
    </main>
  );
}
