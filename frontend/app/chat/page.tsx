"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

function getSessionId() {
  const key = "binara_session_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Halo! Aku Binara Kost Bot. Tanya kamar kosong, harga, booking survey, atau komplain ya.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;

    const msg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, session_id: sessionId }),
      });

      const raw = await res.text();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "bot", text: `Error ${res.status}: ${raw}` },
        ]);
        return;
      }

      const data = JSON.parse(raw);
      setMessages((m) => [
        ...m,
        { role: "bot", text: data.reply ?? "No reply field." },
      ]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "bot", text: `Request failed: ${e?.message ?? String(e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* quick keyframes for loading dots */}
      <style>{css}</style>

      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.brandMark}>
            <div style={styles.brandDot} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={styles.title}>Binara Kost Bot</div>
          </div>
        </div>

        <div style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.row,
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {m.role === "bot" && (
                <div style={{ ...styles.avatar, ...styles.botAvatar }}>B</div>
              )}

              <div
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.userBubble : styles.botBubble),
                }}
              >
                {m.text}
              </div>

              {m.role === "user" && (
                <div style={{ ...styles.avatar, ...styles.userAvatar }}>U</div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.row, justifyContent: "flex-start" }}>
              <div style={{ ...styles.avatar, ...styles.botAvatar }}>B</div>
              <div style={{ ...styles.bubble, ...styles.botBubble }}>
                <span style={styles.dotRow}>
                  <span style={{ ...styles.dot, animationDelay: "0ms" }} />
                  <span style={{ ...styles.dot, animationDelay: "120ms" }} />
                  <span style={{ ...styles.dot, animationDelay: "240ms" }} />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={styles.inputBar}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Contoh: kamar kosong ada?"
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            onClick={send}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const css = `
@keyframes dotPulse {
  0%, 80%, 100% { transform: translateY(0); opacity: .35; }
  40% { transform: translateY(-3px); opacity: .9; }
}
`;

const styles: Record<string, any> = {
  page: {
    minHeight: "100vh",
    padding: 18,
    background:
      "radial-gradient(1200px 700px at 20% 10%, rgba(255,255,255,.85), rgba(255,255,255,0) 55%)," +
      "radial-gradient(900px 600px at 90% 20%, rgba(167,139,250,.45), rgba(255,255,255,0) 60%)," +
      "linear-gradient(180deg, #dbeafe 0%, #f5f3ff 45%, #fff 100%)",
    display: "grid",
    placeItems: "center",
    color: "#0f172a",
  },

  shell: {
    width: "min(980px, 100%)",
    height: "min(820px, calc(100vh - 36px))",
    borderRadius: 22,
    overflow: "hidden",
    background: "rgba(255,255,255,.72)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(15, 23, 42, .10)",
    boxShadow: "0 24px 60px rgba(15,23,42,.12), 0 6px 18px rgba(15,23,42,.06)",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "18px 18px 12px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.55))",
    borderBottom: "1px solid rgba(15, 23, 42, .08)",
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg, rgba(99,102,241,.20), rgba(34,211,238,.18))",
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 10px 22px rgba(99,102,241,.18)",
  },
  brandDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    background: "linear-gradient(135deg,#6366f1,#22d3ee)",
    boxShadow: "0 0 0 6px rgba(99,102,241,.15)",
  },

  title: { fontSize: 18, fontWeight: 800, letterSpacing: -0.2 },
  subtitle: {
    fontSize: 12,
    opacity: 0.75,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  pill: {
    padding: "3px 10px",
    borderRadius: 999,
    background: "rgba(99,102,241,.10)",
    border: "1px solid rgba(99,102,241,.22)",
    fontSize: 12,
    fontWeight: 700,
  },

  chat: {
    flex: 1,
    padding: 18,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background:
      "linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.55))",
  },

  row: { display: "flex", gap: 10, alignItems: "flex-end" },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 12,
    border: "1px solid rgba(15,23,42,.10)",
    boxShadow: "0 10px 18px rgba(15,23,42,.08)",
    userSelect: "none",
  },
  botAvatar: {
    background:
      "linear-gradient(135deg, rgba(34,211,238,.35), rgba(99,102,241,.25))",
  },
  userAvatar: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,.55), rgba(168,85,247,.35))",
  },

  bubble: {
    maxWidth: 560,
    padding: "11px 14px",
    borderRadius: 18,
    lineHeight: 1.4,
    border: "1px solid rgba(15,23,42,.10)",
    whiteSpace: "pre-wrap",
    boxShadow: "0 10px 18px rgba(15,23,42,.06)",
  },

  botBubble: {
    background: "rgba(255,255,255,.92)",
    borderTopLeftRadius: 8,
  },

  userBubble: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,.90), rgba(168,85,247,.78))",
    color: "#fff",
    borderTopRightRadius: 8,
    border: "1px solid rgba(99,102,241,.40)",
  },

  inputBar: {
    display: "flex",
    gap: 10,
    padding: 14,
    borderTop: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.78)",
  },

  input: {
    flex: 1,
    background: "rgba(255,255,255,.95)",
    border: "1px solid rgba(15,23,42,.12)",
    borderRadius: 14,
    padding: "12px 12px",
    color: "#0f172a",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.8)",
  },

  button: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid rgba(99,102,241,.35)",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(99,102,241,.20)",
    transition: "transform .12s ease",
  },
  buttonDisabled: { opacity: 0.65, cursor: "not-allowed" },

  dotRow: { display: "inline-flex", gap: 6, alignItems: "center" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "rgba(15,23,42,.55)",
    animation: "dotPulse 1s infinite ease-in-out",
  },
};
