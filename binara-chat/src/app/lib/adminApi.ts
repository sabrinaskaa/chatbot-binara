export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("binara_admin_token") || "";
}

export async function adminFetch(
  apiBase: string,
  path: string,
  init: RequestInit = {},
) {
  const token = getAdminToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  // auto JSON header if body is object stringified
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    // token invalid / expired
    if (typeof window !== "undefined") {
      localStorage.removeItem("binara_admin_token");
    }
  }

  return res;
}

export async function readJsonSafe(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
