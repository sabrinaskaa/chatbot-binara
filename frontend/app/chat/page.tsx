"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Halo! Aku Binara Kost Bot. Mau cari kamar kosong atau booking survey?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");

    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
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
      <div style={styles.header}>
        <div style={styles.brandDot} />
        <div>
          <div style={styles.title}>Binara Kost Bot</div>
          <div style={styles.subtitle}>
            Cari kamar, tanya aturan, atau booking survey
          </div>
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
            {m.role === "bot" && <div style={styles.avatar}>B</div>}
            <div
              style={{
                ...styles.bubble,
                ...(m.role === "user" ? styles.userBubble : styles.botBubble),
              }}
            >
              {m.text}
            </div>
            {m.role === "user" && (
              <div style={{ ...styles.avatar, background: "#2b2b2b" }}>U</div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.row, justifyContent: "flex-start" }}>
            <div style={styles.avatar}>B</div>
            <div style={{ ...styles.bubble, ...styles.botBubble }}>
              <span style={styles.dots}>● ● ●</span>
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
          placeholder="Tulis pertanyaanmu… (contoh: kamar kosong ada?)"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button style={styles.button} onClick={send} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0b0b0c, #101114)",
    color: "#eaeaea",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "18px 18px 12px",
    borderBottom: "1px solid rgba(255,255,255,.08)",
  },
  brandDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    background: "linear-gradient(180deg, #7c3aed, #22c55e)",
    boxShadow: "0 0 18px rgba(124,58,237,.35)",
  },
  title: { fontSize: 18, fontWeight: 700, letterSpacing: 0.2 },
  subtitle: { fontSize: 12, opacity: 0.75 },
  chat: {
    flex: 1,
    padding: 18,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  row: { display: "flex", gap: 10, alignItems: "flex-end" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    background: "#1b1b1f",
    border: "1px solid rgba(255,255,255,.08)",
  },
  bubble: {
    maxWidth: 520,
    padding: "10px 12px",
    borderRadius: 16,
    lineHeight: 1.35,
    border: "1px solid rgba(255,255,255,.08)",
    whiteSpace: "pre-wrap",
  },
  botBubble: {
    background: "rgba(255,255,255,.04)",
    borderTopLeftRadius: 6,
  },
  userBubble: {
    background: "rgba(124,58,237,.18)",
    borderTopRightRadius: 6,
  },
  inputBar: {
    display: "flex",
    gap: 10,
    padding: 14,
    borderTop: "1px solid rgba(255,255,255,.08)",
    background: "rgba(0,0,0,.25)",
  },
  input: {
    flex: 1,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 12,
    padding: "12px 12px",
    color: "#fff",
    outline: "none",
  },
  button: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.10)",
    background:
      "linear-gradient(180deg, rgba(124,58,237,.85), rgba(124,58,237,.55))",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  dots: { letterSpacing: 2, opacity: 0.8 },
};
