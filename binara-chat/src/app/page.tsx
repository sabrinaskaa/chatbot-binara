"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type KostInfo = {
  name?: string;
  tagline?: string;
  address?: string;
  whatsapp?: string;
  google_maps_url?: string;
  visiting_hours?: string;
  area_note?: string; // optional: misal "dekat kampus/akses jalan"
};

type Room = {
  id?: number;
  code?: string;
  title?: string;
  price_monthly?: number | string;
  deposit?: number | string;
  is_available?: boolean;
  size_m2?: number | string;
  facilities?: string; // bisa string "AC, WiFi, ..."
};

function formatPhoneToWa(raw?: string) {
  if (!raw) return "";
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("08")) return "62" + digits.slice(1);
  if (digits.startsWith("+62")) return digits.slice(1);
  return digits;
}

function moneyIDR(v: any) {
  const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";
  return "Rp " + n.toLocaleString("id-ID");
}

function cx(...a: Array<string | false | undefined | null>) {
  return a.filter(Boolean).join(" ");
}

function GlowBg() {
  return (
    <>
      <div className="fixed inset-0 -z-20 bg-[#070713]" />
      <div className="fixed inset-0 -z-10 opacity-95 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(236,72,153,.28),transparent_55%),radial-gradient(1000px_circle_at_85%_15%,rgba(99,102,241,.28),transparent_55%),radial-gradient(1100px_circle_at_50%_95%,rgba(255,255,255,.06),transparent_65%)]" />
      <div className="fixed inset-0 -z-10 pointer-events-none [mask-image:radial-gradient(circle_at_center,rgba(0,0,0,1),rgba(0,0,0,.25),transparent_70%)]">
        <div className="h-full w-full opacity-[0.06] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>
    </>
  );
}

function BrandBadge() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-2xl grid place-items-center bg-gradient-to-br from-fuchsia-500/90 to-indigo-500/90 shadow-[0_0_0_1px_rgba(255,255,255,.12),0_12px_30px_rgba(0,0,0,.35)]">
        <span className="text-2xl">🏠</span>
      </div>
      <div className="leading-tight">
        <div className="text-lg font-semibold tracking-tight">Binara Kost</div>
        <div className="text-xs text-white/55">Stay comfy, ask anything.</div>
      </div>
    </div>
  );
}

function Glass({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/10 border border-white/10 text-xs text-white/75">
      {children}
    </span>
  );
}

function ActionButton({
  href,
  label,
  icon,
  variant = "solid",
  disabled,
}: {
  href?: string;
  label: string;
  icon: string;
  variant?: "solid" | "ghost";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition border";
  const solid =
    "bg-gradient-to-br from-fuchsia-500/85 to-indigo-500/85 border-white/10 hover:from-fuchsia-500 hover:to-indigo-500 shadow-[0_14px_30px_rgba(0,0,0,.35)]";
  const ghost = "bg-white/10 border-white/10 hover:bg-white/15 text-white/90";

  if (disabled) {
    return (
      <div
        className={cx(
          base,
          "bg-white/5 border-white/10 text-white/40 cursor-not-allowed select-none"
        )}
      >
        <span>{icon}</span>
        {label}
      </div>
    );
  }

  return (
    <Link
      href={href || "#"}
      className={cx(base, variant === "solid" ? solid : ghost)}
    >
      <span className="text-base">{icon}</span>
      {label}
      <span className="opacity-70">→</span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="text-white/55 text-xs">{label}</div>
      <div className="text-white font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-xs text-white/55">{kicker}</div>
      <div className="text-xl sm:text-2xl font-semibold tracking-tight mt-1">
        {title}
      </div>
      {desc ? <div className="text-white/70 mt-1">{desc}</div> : null}
    </div>
  );
}

function RoomCard({ r }: { r: Room }) {
  const price = moneyIDR(r.price_monthly);
  const dep = moneyIDR(r.deposit);
  const avail = r.is_available ?? true;

  const chips = (r.facilities || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="group rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.06] transition shadow-[0_0_0_1px_rgba(255,255,255,.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white font-semibold">
            {r.title || r.code || "Kamar"}
          </div>
          <div className="text-white/55 text-sm mt-0.5">
            {r.size_m2 ? `${r.size_m2} m²` : "Nyaman & rapi"}
          </div>
        </div>
        <div
          className={cx(
            "rounded-full px-3 py-1 text-xs border",
            avail
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
              : "bg-rose-500/10 border-rose-500/20 text-rose-200"
          )}
        >
          {avail ? "Tersedia" : "Penuh"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2">
          <div className="text-xs text-white/55">Harga / bulan</div>
          <div className="font-semibold">{price || "—"}</div>
        </div>
        <div className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2">
          <div className="text-xs text-white/55">Deposit</div>
          <div className="font-semibold">{dep || "—"}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.length ? (
          chips.map((c, i) => (
            <span
              key={i}
              className="text-xs rounded-full px-3 py-1 bg-white/10 border border-white/10 text-white/75"
            >
              {c}
            </span>
          ))
        ) : (
          <span className="text-sm text-white/50">Fasilitas belum diisi.</span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-white/45">Tanya detail lewat chat</div>
        <Link
          href="/bot"
          className="text-sm text-white/80 hover:text-white transition"
        >
          Buka chat →
        </Link>
      </div>
    </div>
  );
}

function FloatingChatButton() {
  return (
    <Link href="/bot" className="fixed bottom-6 right-6 z-50 group">
      <div className="rounded-3xl p-[1px] bg-gradient-to-br from-fuchsia-500/70 to-indigo-500/70 shadow-[0_18px_40px_rgba(0,0,0,.45)]">
        <div className="flex items-center gap-3 rounded-3xl bg-black/60 backdrop-blur-xl px-4 py-3 border border-white/10">
          <div className="h-11 w-11 rounded-2xl grid place-items-center bg-white/10 border border-white/10">
            <span className="text-xl">💬</span>
          </div>
          <div className="leading-tight">
            <div className="text-white text-sm font-semibold">
              Chat Kost Binara
            </div>
            <div className="text-white/60 text-xs">
              kamar • harga • aturan • bayar
            </div>
          </div>
          <div className="ml-1 text-white/70 group-hover:text-white transition">
            →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const [kost, setKost] = useState<KostInfo | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const wa = useMemo(() => formatPhoneToWa(kost?.whatsapp), [kost?.whatsapp]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) info kost
        const kostRes = await fetch(`${apiBase}/api/public/kost`, {
          cache: "no-store",
        });
        const kostJson = kostRes.ok ? await kostRes.json() : null;

        // 2) rooms (optional) — kalau endpoint belum ada, UI tetap aman
        let roomsJson: Room[] = [];
        try {
          const roomRes = await fetch(`${apiBase}/api/public/rooms`, {
            cache: "no-store",
          });
          if (roomRes.ok) roomsJson = await roomRes.json();
        } catch {}

        setKost(
          kostJson || {
            name: "Binara Kost",
            tagline: "Kost nyaman, info jelas, tinggal chat.",
            address: "Alamat belum diisi di database.",
            whatsapp: "",
            google_maps_url: "",
            visiting_hours: "",
            area_note: "Akses mudah & lingkungan aman.",
          }
        );

        setRooms(
          Array.isArray(roomsJson) && roomsJson.length
            ? roomsJson
            : [
                {
                  code: "A-01",
                  title: "Kamar Standard",
                  price_monthly: 1200000,
                  deposit: 500000,
                  is_available: true,
                  size_m2: 12,
                  facilities: "WiFi, Kamar mandi dalam, Lemari, Kasur",
                },
                {
                  code: "B-02",
                  title: "Kamar Premium",
                  price_monthly: 1700000,
                  deposit: 700000,
                  is_available: false,
                  size_m2: 14,
                  facilities: "AC, WiFi, Kamar mandi dalam, Meja belajar",
                },
              ]
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase]);

  const tagline =
    kost?.tagline ||
    "Cari kost tanpa ribet — lihat info, lalu tanya lewat chat.";

  return (
    <main className="min-h-screen text-white">
      <GlowBg />

      {/* NAV */}
      <header className="max-w-6xl mx-auto px-5 pt-6">
        <Glass className="p-5 flex items-center justify-between">
          <BrandBadge />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-white/80">Online</span>
            </div>

            <Link
              href="/bot"
              className="rounded-2xl px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm font-medium"
            >
              Buka Chatbot →
            </Link>
          </div>
        </Glass>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-5 pt-8 pb-10">
        <div className="grid lg:grid-cols-2 gap-6">
          <Glass className="p-7 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="flex flex-wrap gap-2">
              <Pill>✨ Info kost cepat</Pill>
              <Pill>🔒 Fokus Kost Binara</Pill>
              <Pill>⚡ Jawaban jelas</Pill>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
              {kost?.name || "Binara Kost"}{" "}
              <span className="text-white/65">
                — tinggal chat kalau mau detail.
              </span>
            </h1>

            <p className="mt-3 text-white/70 leading-relaxed">{tagline}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton
                href="/bot"
                label="Mulai Chat"
                icon="💬"
                variant="solid"
              />
              <ActionButton
                href={wa ? `https://wa.me/${wa}` : undefined}
                label="WhatsApp Pemilik"
                icon="📲"
                variant="ghost"
                disabled={!wa}
              />
              <ActionButton
                href={kost?.google_maps_url || undefined}
                label="Buka Maps"
                icon="🗺️"
                variant="ghost"
                disabled={!kost?.google_maps_url}
              />
            </div>

            <div className="mt-7 grid sm:grid-cols-3 gap-3">
              <Stat label="Alamat" value={kost?.address ? "Tersedia" : "—"} />
              <Stat label="Jam Kunjungan" value={kost?.visiting_hours || "—"} />
              <Stat label="Respon" value="Cepat & sopan" />
            </div>

            {kost?.area_note ? (
              <div className="mt-5 text-sm text-white/60">
                <span className="text-white/80">Catatan area: </span>
                {kost.area_note}
              </div>
            ) : null}
          </Glass>

          {/* RIGHT COLUMN */}
          <div className="grid gap-4">
            <Glass className="p-6">
              <SectionTitle
                kicker="INFO INTI"
                title="Kontak & Lokasi"
                desc="Biar user yakin dulu sebelum chat."
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs text-white/55">📍 Alamat</div>
                  <div className="mt-1 text-white/90 leading-relaxed">
                    {kost?.address || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs text-white/55">📲 WhatsApp</div>
                  <div className="mt-1 text-white/90">
                    {kost?.whatsapp || "Belum diisi"}
                  </div>
                  <div className="mt-3">
                    {wa ? (
                      <a
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
                      >
                        Chat WA →
                      </a>
                    ) : (
                      <div className="text-xs text-white/45">
                        Isi dulu nomor di DB ya.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-white/55">🧭 Jam Kunjungan</div>
                <div className="mt-1 text-white/90">
                  {kost?.visiting_hours || "—"}
                </div>
              </div>
            </Glass>

            <div className="grid sm:grid-cols-2 gap-4">
              <Glass className="p-5">
                <div className="text-sm font-semibold">Yang bisa ditanya</div>
                <ul className="mt-3 text-sm text-white/75 space-y-2">
                  <li>• Kamar tersedia + harga</li>
                  <li>• Fasilitas kamar/umum</li>
                  <li>• Aturan & jam malam</li>
                  <li>• Pembayaran, deposit, listrik</li>
                  <li>• Laundry terdekat (kalau ada data)</li>
                </ul>
              </Glass>

              <Glass className="p-5">
                <div className="text-sm font-semibold">Yang bakal ditolak</div>
                <div className="mt-3 text-sm text-white/70 leading-relaxed">
                  Pertanyaan di luar topik Kost Binara biar gak ngaco. Jadi
                  chatbot lo keliatan “punya batasan”, bukan asal jawab.
                </div>
                <div className="mt-3 text-xs text-white/50">
                  contoh: tugas kuliah random, politik, dll.
                </div>
              </Glass>
            </div>
          </div>
        </div>
      </section>

      {/* ROOMS PREVIEW */}
      <section className="max-w-6xl mx-auto px-5 pb-10">
        <SectionTitle
          kicker="PREVIEW"
          title="Kamar yang ada"
          desc="Ini cuma preview. Detail lengkap? tinggal chat."
        />

        <div className="grid md:grid-cols-2 gap-4">
          {(loading ? Array.from({ length: 2 }) : rooms.slice(0, 4)).map(
            (r: any, i) =>
              loading ? (
                <div
                  key={i}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 animate-pulse"
                >
                  <div className="h-5 w-40 bg-white/10 rounded mb-3" />
                  <div className="h-4 w-24 bg-white/10 rounded mb-6" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-14 bg-white/10 rounded-2xl" />
                    <div className="h-14 bg-white/10 rounded-2xl" />
                  </div>
                  <div className="mt-4 h-8 bg-white/10 rounded-2xl" />
                </div>
              ) : (
                <RoomCard key={i} r={r} />
              )
          )}
        </div>
      </section>

      {/* LOCATION / MAP */}
      <section className="max-w-6xl mx-auto px-5 pb-14">
        <div className="grid lg:grid-cols-2 gap-6">
          <Glass className="p-6">
            <SectionTitle
              kicker="LOKASI"
              title="Arah & akses"
              desc="Biar user gak takut nyasar."
            />
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-white/55">Alamat</div>
              <div className="mt-1 text-white/90 leading-relaxed">
                {kost?.address || "—"}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <ActionButton
                href={kost?.google_maps_url || undefined}
                label="Buka Google Maps"
                icon="🗺️"
                variant="ghost"
                disabled={!kost?.google_maps_url}
              />
              <ActionButton
                href="/bot"
                label="Tanya akses lewat chat"
                icon="💬"
                variant="ghost"
              />
            </div>

            <div className="mt-4 text-sm text-white/60">
              Tip: kalau lo punya “patokan” (misal dekat minimarket/gerbang),
              taruh di DB biar makin meyakinkan.
            </div>
          </Glass>

          <Glass className="p-6">
            <SectionTitle
              kicker="CTA"
              title="Ready buat survey?"
              desc="Klik chat, nanti bot bantu jawab sebelum kamu datang."
            />
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 to-indigo-500/15 p-5">
              <div className="text-white/85">
                Kalau mau tanya:
                <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm text-white/75">
                  <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                    ✅ Kamar kosong
                  </div>
                  <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                    ✅ Biaya tambahan
                  </div>
                  <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                    ✅ Aturan kost
                  </div>
                  <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                    ✅ Fasilitas
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton
                  href="/bot"
                  label="Chat sekarang"
                  icon="💬"
                  variant="solid"
                />
                <ActionButton
                  href={wa ? `https://wa.me/${wa}` : undefined}
                  label="WhatsApp pemilik"
                  icon="📲"
                  variant="ghost"
                  disabled={!wa}
                />
              </div>
            </div>
          </Glass>
        </div>
      </section>

      <FloatingChatButton />

      <footer className="max-w-6xl mx-auto px-5 pb-10 text-white/40 text-xs">
        © {new Date().getFullYear()} Binara Kost — landing page + chatbot.
      </footer>
    </main>
  );
}
