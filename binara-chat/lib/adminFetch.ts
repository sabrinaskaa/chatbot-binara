export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("binara_admin_token") ?? "";
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("binara_admin_token", token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("binara_admin_token");
}

export async function adminFetch(
  apiBase: string,
  path: string,
  init?: RequestInit,
) {
  const token = getAdminToken();

  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  // ini kuncinya:
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
  });

  // kalau token invalid/expired, auto kick ke login
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("binara_admin_token");
    }
  }

  return res;
}
