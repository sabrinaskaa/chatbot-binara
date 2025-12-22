import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const backend = process.env.BACKEND_URL || "http://127.0.0.1:8000";

  const r = await fetch(`${backend}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
