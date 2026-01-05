import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const backend = process.env.BACKEND_URL || "http://127.0.0.1:8000";

  try {
    const r = await fetch(`${backend}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await r.text();

    // kalau backend error, tetap balikin ke UI biar kebaca
    return new NextResponse(
      text || JSON.stringify({ reply: "Empty response from backend" }),
      {
        status: r.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ reply: `Proxy error: ${e?.message ?? String(e)}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
