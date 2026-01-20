"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2 } from "lucide-react";

type Msg = { role: "user" | "bot"; text: string; ts?: number };

type KostInfo = {
  name?: string;
  address?: string;
  phone_owner?: string;
  phone_alt?: string;
  maps_url?: string;
  type?: string; // putra/putri/campur
  visit_hours?: string;
  notes?: string;
};

function safeJoin(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(" • ");
}

function formatPhone(phone?: string) {
  if (!phone) return "";
  // biar link wa lebih aman: buang spasi + tanda
  const digits = phone.replace(/[^\d+]/g, "");
  return digits;
}

function getSessionId() {
  const key = "binara_session_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export default function Page() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const [sessionId, setSessionId] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "Halo! Aku Binara Kost Bot. Kamu bisa tanya kamar tersedia, harga, fasilitas, aturan, pembayaran, biaya tambahan, kontak, dan laundry terdekat.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [kost, setKost] = useState<KostInfo | null>(null);
  const [kostErr, setKostErr] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  // Fetch “Kost Profile”
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setKostErr("");
        const res = await fetch(`${apiBase}/api/public/kost`, {
          method: "GET",
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${t}`);
        }
        const data = await res.json();
        if (alive) setKost(data);
      } catch (e: any) {
        if (alive) setKostErr(e?.message ?? String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiBase]);

  const quickChips = useMemo(
    () => [
      "Alamat kostnya di mana?",
      "Nomor WA pemilik kost?",
      "Kamar yang tersedia apa saja + harganya?",
      "Fasilitas tiap kamar apa aja?",
      "Aturan kostnya gimana?",
      "Pembayarannya bulanan atau tahunan?",
      "Laundry terdekat dari kost?",
    ],
    [],
  );

  async function send(message?: string) {
    const text = (message ?? input).trim();
    if (!text || !sessionId) return;

    setMsgs((m) => [...m, { role: "user", text, ts: Date.now() }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Backend error ${res.status}: ${errText || "No body"}`);
      }

      const data = await res.json();
      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          text: data.answer ?? "(Jawaban kosong)",
          ts: Date.now(),
        },
      ]);
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          text:
            "Backend error. Cek FastAPI jalan di port 8000 dan endpoint /api/chat.\n\nDetail: " +
            (e?.message ?? String(e)),
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 500px at 20% 0%, rgba(99,102,241,0.12), transparent 60%), radial-gradient(900px 400px at 80% 20%, rgba(236,72,153,0.10), transparent 55%), #0b0b10",
        color: "#eaeaf2",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <div
        style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 16px 28px" }}
      >
        {/* Topbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 14px",
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="h-12 w-12 rounded-2xl grid place-items-center bg-gradient-to-br from-fuchsia-500 to-indigo-500 shadow-lg">
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <div
                style={{ fontSize: 16, fontWeight: 750, letterSpacing: 0.2 }}
              >
                Binara Kost Chatbot
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.8 }}>
                Sabrina Aska - 085183388925
              </div>
            </div>
          </div>

          <BackendStatus apiBase={apiBase} />
        </div>

        {/* Body grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: 14,
            marginTop: 14,
          }}
        >
          {/* Sidebar */}
          <aside
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              padding: 14,
              backdropFilter: "blur(10px)",
              height: "calc(100vh - 140px)",
              position: "sticky",
              top: 14,
              overflow: "auto",
            }}
          >
            {kostErr ? (
              <div style={cardStyle()}>
                <div style={{ fontWeight: 650, marginBottom: 6 }}>
                  Gagal ambil data kost
                </div>
                <div
                  style={{
                    opacity: 0.85,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {kostErr}
                </div>
                <div style={{ opacity: 0.7, fontSize: 12, marginTop: 10 }}>
                  Pastikan backend punya endpoint <code>/api/public/kost</code>{" "}
                  dan DB tabel <code>kost</code> ada.
                </div>
              </div>
            ) : (
              <KostCard kost={kost} />
            )}

            <div style={{ height: 10 }} />

            <SectionTitle
              title="Quick Actions"
              subtitle="Klik untuk langsung bertanya!"
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {quickChips.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#eaeaf2",
                    padding: "9px 10px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    cursor: "pointer",
                    transition: "transform 0.08s ease",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.98)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={{ height: 14 }} />
          </aside>

          {/* Chat Panel */}
          <section
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(10px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 140px)",
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontWeight: 750 }}>Chat</div>
            </div>

            <div style={{ padding: 14, overflow: "auto", flex: 1 }}>
              {msgs.map((m, i) => (
                <ChatBubble key={i} msg={m} />
              ))}
              {loading && (
                <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
                  Bot sedang mengetik…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div
              style={{
                padding: 14,
                borderTop: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tulis pertanyaan kamu…"
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.25)",
                    color: "#eaeaf2",
                    outline: "none",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />

                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background:
                      !input.trim() || loading
                        ? "rgba(255,255,255,0.08)"
                        : "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(236,72,153,0.95))",
                    color: "#fff",
                    fontWeight: 750,
                    cursor:
                      !input.trim() || loading ? "not-allowed" : "pointer",
                  }}
                >
                  Kirim
                </button>

                <VoiceButton
                  onText={(t) => setInput((p) => (p ? p + " " + t : t))}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 13.5 }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 12.5, opacity: 0.75 }}>{subtitle}</div>
      )}
    </div>
  );
}

function cardStyle() {
  return {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
  } as const;
}

function KostCard({ kost }: { kost: KostInfo | null }) {
  const name = kost?.name || "Kost Binara";
  const address = kost?.address || "Alamat belum diisi di database.";
  const phone = kost?.phone_owner || "";
  const phoneAlt = kost?.phone_alt || "";
  const wa = formatPhone(phone || phoneAlt);
  const maps = kost?.maps_url || "";
  const meta = safeJoin(kost?.type, kost?.visit_hours);

  return (
    <div style={cardStyle()}>
      <div style={{ fontSize: 15, fontWeight: 850, marginBottom: 6 }}>
        {name}
      </div>

      <div
        style={{
          fontSize: 13.5,
          opacity: 0.9,
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
        }}
      >
        {address}
      </div>

      {meta && (
        <div style={{ marginTop: 8, fontSize: 12.5, opacity: 0.75 }}>
          {meta}
        </div>
      )}

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {phone && (
            <a
              href={`tel:${formatPhone(phone)}`}
              style={miniLinkStyle()}
              title="Telepon pemilik"
            >
              📞 {phone}
            </a>
          )}
          {wa && (
            <a
              href={`https://wa.me/${wa.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
              style={miniLinkStyle()}
              title="WhatsApp"
            >
              💬 WhatsApp
            </a>
          )}
          {maps && (
            <a
              href={maps}
              target="_blank"
              rel="noreferrer"
              style={miniLinkStyle()}
              title="Buka Maps"
            >
              📍 Maps
            </a>
          )}
        </div>

        {kost?.notes && (
          <div style={{ fontSize: 12.5, opacity: 0.8, whiteSpace: "pre-wrap" }}>
            {kost.notes}
          </div>
        )}

        {!kost && (
          <div style={{ fontSize: 12.5, opacity: 0.75 }}>
            Belum ada data profil dari backend. Isi tabel <code>kost</code> biar
            sidebar ini informatif.
          </div>
        )}
      </div>
    </div>
  );
}

function miniLinkStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#eaeaf2",
    textDecoration: "none",
    fontSize: 12.5,
    fontWeight: 650,
  } as const;
}

function ChatBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        margin: "10px 0",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "12px 14px",
          borderRadius: 16,
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
          border: "1px solid rgba(255,255,255,0.12)",
          background: isUser
            ? "linear-gradient(135deg, rgba(99,102,241,0.28), rgba(236,72,153,0.22))"
            : "rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ fontSize: 13.5 }}>{msg.text}</div>
        {msg.ts && (
          <div style={{ marginTop: 6, fontSize: 11.5, opacity: 0.6 }}>
            {new Date(msg.ts).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BackendStatus({ apiBase }: { apiBase: string }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/health`);
        if (!res.ok) throw new Error();
        if (alive) setOk(true);
      } catch {
        if (alive) setOk(false);
      }
    })();
    const t = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/api/health`);
        if (!res.ok) throw new Error();
        if (alive) setOk(true);
      } catch {
        if (alive) setOk(false);
      }
    }, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [apiBase]);

  const label = ok === null ? "checking…" : ok ? "Online" : "Offline";

  return (
    <div
      style={{
        padding: "9px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.25)",
        fontSize: 12.5,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 99,
          background:
            ok === null ? "rgba(255,255,255,0.5)" : ok ? "#22c55e" : "#ef4444",
          display: "inline-block",
        }}
      />
      <span style={{ opacity: 0.85 }}>{label}</span>
    </div>
  );
}

function VoiceButton({ onText }: { onText: (t: string) => void }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function start() {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? "";
      if (text) onText(text);
    };

    rec.start();
  }

  return (
    <button
      onClick={start}
      disabled={!supported}
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: supported
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.08)",
        color: "#eaeaf2",
        fontWeight: 750,
        cursor: supported ? "pointer" : "not-allowed",
        minWidth: 118,
      }}
      title={
        !supported
          ? "Voice input belum didukung browser ini (coba Chrome/Edge)"
          : "Klik untuk voice input"
      }
    >
      {listening ? "🎙️ Listening…" : "🎙️ Voice"}
    </button>
  );
}
