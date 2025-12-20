"use client";

import { useState } from "react";
import { sendMessage } from "@/services/chatService";

type ChatMessage = {
  sender: "user" | "bot";
  text: string;
};

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendMessage(input);

      const botMessage: ChatMessage = {
        sender: "bot",
        text: result.reply,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Terjadi kesalahan pada server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded-lg">
      <h1 className="text-xl font-bold mb-4 text-center">Chatbot Kost</h1>

      <div className="h-80 overflow-y-auto border p-3 mb-3 rounded">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${
              msg.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`inline-block px-3 py-2 rounded ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-900"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}

        {loading && (
          <div className="text-left text-sm text-gray-500">
            Bot sedang mengetik...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan tentang kost..."
          className="flex-1 border rounded px-3 py-2"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}
