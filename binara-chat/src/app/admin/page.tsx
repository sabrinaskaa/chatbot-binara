"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  LogOut,
  Settings,
  BedDouble,
  MapPinned,
  ScrollText,
  Shapes,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ExternalLink,
  Filter,
} from "lucide-react";

type ApiFn = <T = any>(path: string, init?: RequestInit) => Promise<T>;

type Kost = {
  name: string;
  address: string;
  whatsapp: string;
  google_maps_url: string;
  visiting_hours: string;
};

type Facility = { id: number; name: string };

type Room = {
  id: number;
  code: string;
  price_monthly: number | null;
  deposit: number | null;
  electricity_included: number | boolean;
  electricity_note: string;
  size_m2: number | null;
  is_available: number | boolean;
  notes: string;
  facilities: Facility[];
};

type Nearby = {
  id: number;
  category: "laundry" | "minimarket" | "makan" | "transport" | "lainnya";
  name: string;
  address: string;
  distance_m: number | null;
  maps_url: string;
  note: string;
};

type Rule = {
  id: number;
  title: string;
  description: string;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("binara_admin_token") || "";
}

function isTrue(v: any) {
  return v === true || v === 1 || v === "1";
}

function waLink(raw: string) {
  if (!raw) return "";
  const cleaned = raw.replace(/\D/g, "");
  if (!cleaned) return "";
  const normalized = cleaned.startsWith("0")
    ? "62" + cleaned.slice(1)
    : cleaned;
  return `https://wa.me/${normalized}`;
}

function money(n: number | null) {
  if (n === null || n === undefined) return "-";
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
}

function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pages = useMemo(() => {
    const arr: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <div className="text-slate-300">
        Page <span className="font-semibold text-slate-100">{page}</span> /{" "}
        {totalPages} • Total {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={!canPrev}
          onClick={() => onPage(page - 1)}
          className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-40"
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`rounded-xl px-3 py-2 ring-1 ring-white/10 ${
              p === page
                ? "bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 text-white"
                : "bg-white/5 hover:bg-white/10 text-slate-200"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={!canNext}
          onClick={() => onPage(page + 1)}
          className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-950/90 p-5 ring-1 ring-white/10 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-100">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 p-2 ring-1 ring-white/10 hover:bg-white/10"
          >
            <X className="h-4 w-4 text-slate-200" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  const kostId = 1;

  const [tab, setTab] = useState<
    "kost" | "rooms" | "nearby" | "rules" | "facilities"
  >("kost");

  function logout() {
    localStorage.removeItem("binara_admin_token");
    router.replace("/admin/login");
  }

  const api: ApiFn = async <T,>(path: string, init?: RequestInit) => {
    const token = getToken();
    if (!token) {
      router.replace("/admin/login");
      throw new Error("No token");
    }

    // Biar headers type-safe (nggak kena drama spread HeadersInit)
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      localStorage.removeItem("binara_admin_token");
      router.replace("/admin/login");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Request failed (${res.status})`);
    }

    // Handle 204 No Content (DELETE kadang gini)
    if (res.status === 204) return undefined as unknown as T;

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const t = await res.text().catch(() => "");
      return t as unknown as T;
    }

    return (await res.json()) as T;
  };

  useEffect(() => {
    if (!getToken()) router.replace("/admin/login");
  }, [router]);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        {/* HEADER */}
        <div className="mb-6 overflow-hidden rounded-[28px] ring-1 ring-white/10">
          <div className="relative bg-gradient-to-r from-fuchsia-500/20 via-indigo-500/15 to-slate-900/30 p-5 backdrop-blur">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
                  <Home className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <div className="text-sm text-slate-300">Binara Kost</div>
                  <div className="text-xl font-semibold tracking-tight text-slate-50">
                    Admin Dashboard
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-100 ring-1 ring-white/10 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mb-6 flex flex-wrap gap-2">
          <TabButton
            active={tab === "kost"}
            onClick={() => setTab("kost")}
            icon={<Settings className="h-4 w-4" />}
            label="Kost"
          />
          <TabButton
            active={tab === "rooms"}
            onClick={() => setTab("rooms")}
            icon={<BedDouble className="h-4 w-4" />}
            label="Rooms"
          />
          <TabButton
            active={tab === "nearby"}
            onClick={() => setTab("nearby")}
            icon={<MapPinned className="h-4 w-4" />}
            label="Nearby"
          />
          <TabButton
            active={tab === "rules"}
            onClick={() => setTab("rules")}
            icon={<ScrollText className="h-4 w-4" />}
            label="Rules"
          />
          <TabButton
            active={tab === "facilities"}
            onClick={() => setTab("facilities")}
            icon={<Shapes className="h-4 w-4" />}
            label="Facilities"
          />
        </div>

        {/* CONTENT */}
        {tab === "kost" && <KostSection api={api} kostId={kostId} />}
        {tab === "rooms" && <RoomsSection api={api} kostId={kostId} />}
        {tab === "nearby" && <NearbySection api={api} kostId={kostId} />}
        {tab === "rules" && <RulesSection api={api} kostId={kostId} />}
        {tab === "facilities" && <FacilitiesSection api={api} />}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm ring-1 ring-white/10 transition ${
        active
          ? "bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 text-white"
          : "bg-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
      <div className="mb-2 text-base font-semibold text-slate-100">{title}</div>
      {subtitle ? (
        <div className="mb-6 text-sm text-slate-300">{subtitle}</div>
      ) : null}
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-slate-300">{label}</div>
      {children}
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

/* ===================== Kost ===================== */
function KostSection({ api, kostId }: { api: ApiFn; kostId: number }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [kost, setKost] = useState<Kost>({
    name: "",
    address: "",
    whatsapp: "",
    google_maps_url: "",
    visiting_hours: "",
  });

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await api<Kost>(`/api/admin/kost?kost_id=${kostId}`);
      setKost({
        name: data?.name || "",
        address: data?.address || "",
        whatsapp: data?.whatsapp || "",
        google_maps_url: data?.google_maps_url || "",
        visiting_hours: data?.visiting_hours || "",
      });
    } catch (e: any) {
      setErr(e?.message || "Gagal load");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setErr("");
    setSaving(true);
    try {
      await api(`/api/admin/kost?kost_id=${kostId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kost),
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Gagal simpan");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card title="Info Kost">
        {err ? (
          <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-300">Loading...</div>
        ) : (
          <div className="space-y-4">
            <Field label="Nama kost">
              <input
                value={kost.name}
                onChange={(e) =>
                  setKost((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none placeholder:text-slate-400 focus:ring-indigo-400/50"
              />
            </Field>

            <Field label="Alamat lengkap">
              <textarea
                value={kost.address}
                onChange={(e) =>
                  setKost((p) => ({ ...p, address: e.target.value }))
                }
                className="min-h-[110px] w-full resize-y rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none placeholder:text-slate-400 focus:ring-indigo-400/50"
              />
            </Field>

            <Field label="Nomor WhatsApp">
              <input
                value={kost.whatsapp}
                onChange={(e) =>
                  setKost((p) => ({ ...p, whatsapp: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none placeholder:text-slate-400 focus:ring-indigo-400/50"
              />
            </Field>

            <Field label="Google Maps URL">
              <input
                value={kost.google_maps_url}
                onChange={(e) =>
                  setKost((p) => ({ ...p, google_maps_url: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none placeholder:text-slate-400 focus:ring-indigo-400/50"
              />
            </Field>

            <Field label="Jam kunjungan / survey">
              <input
                value={kost.visiting_hours}
                onChange={(e) =>
                  setKost((p) => ({ ...p, visiting_hours: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none placeholder:text-slate-400 focus:ring-indigo-400/50"
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-3 font-semibold text-white ring-1 ring-white/10 hover:opacity-95 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card title="Preview (Public)" subtitle="Yang user lihat (quick info).">
        <div className="rounded-3xl bg-black/20 p-5 ring-1 ring-white/5">
          <div className="text-lg font-semibold text-slate-100">
            {kost.name || "Kost Binara"}
          </div>
          <div className="mt-1 text-sm text-slate-300">
            {kost.visiting_hours
              ? `Jam kunjungan: ${kost.visiting_hours}`
              : "Jam kunjungan: -"}
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-200">
            <div>
              <div className="text-xs text-slate-400">Alamat</div>
              <div>{kost.address || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">WhatsApp</div>
              <a
                className="text-indigo-300 hover:underline"
                href={waLink(kost.whatsapp) || "#"}
                target="_blank"
                rel="noreferrer"
              >
                {kost.whatsapp || "-"}
              </a>
            </div>
            <div>
              <div className="text-xs text-slate-400">Google Maps</div>
              <a
                className="text-indigo-300 hover:underline"
                href={kost.google_maps_url || "#"}
                target="_blank"
                rel="noreferrer"
              >
                {kost.google_maps_url ? "Buka lokasi di Maps" : "-"}
              </a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ===================== Facilities ===================== */
function FacilitiesSection({ api }: { api: ApiFn }) {
  const [items, setItems] = useState<Facility[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<Facility | null>(null);
  const [name, setName] = useState("");

  async function load(p = page) {
    setErr("");
    try {
      const data = await api<{
        items: Facility[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/admin/facilities?page=${p}&page_size=${pageSize}`);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (e: any) {
      setErr(e?.message || "Gagal load");
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line
  }, []);

  function openAdd() {
    setEdit(null);
    setName("");
    setModalOpen(true);
  }

  function openEdit(x: Facility) {
    setEdit(x);
    setName(x.name);
    setModalOpen(true);
  }

  async function save() {
    setErr("");
    try {
      if (!name.trim()) throw new Error("Nama facility kosong");
      if (edit) {
        await api(`/api/admin/facilities/${edit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      } else {
        await api(`/api/admin/facilities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      }
      setModalOpen(false);
      await load(page);
    } catch (e: any) {
      setErr(e?.message || "Gagal simpan");
    }
  }

  async function del(id: number) {
    if (!confirm("Hapus facility? Kalau masih dipakai kamar, bakal gagal."))
      return;
    setErr("");
    try {
      await api(`/api/admin/facilities/${id}`, { method: "DELETE" });
      await load(page);
    } catch (e: any) {
      setErr(e?.message || "Gagal hapus");
    }
  }

  return (
    <Card
      title="Master Facilities"
      subtitle="Daftar fasilitas global. Per kamar tinggal centang."
    >
      {err ? (
        <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
          {err}
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-300">
          Total: <span className="font-semibold text-slate-100">{total}</span>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Add Facility
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((x) => (
              <tr key={x.id} className="text-slate-100">
                <td className="px-4 py-3">{x.name}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(x)}
                      className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => del(x.id)}
                      className="rounded-xl bg-red-500/10 px-3 py-2 text-red-200 ring-1 ring-red-500/20 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-300" colSpan={2}>
                  Kosong. Tambah facility dulu.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPage={load} />

      <Modal
        open={modalOpen}
        title={edit ? "Edit Facility" : "Add Facility"}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
            />
          </Field>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-2xl bg-white/5 px-4 py-2 ring-1 ring-white/10 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-2 font-semibold text-white ring-1 ring-white/10 hover:opacity-95"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

/* ===================== Rooms ===================== */
function RoomsSection({ api, kostId }: { api: ApiFn; kostId: number }) {
  const [items, setItems] = useState<Room[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<Room | null>(null);

  const [form, setForm] = useState({
    code: "",
    price_monthly: "",
    deposit: "",
    electricity_included: false,
    electricity_note: "",
    size_m2: "",
    is_available: true,
    notes: "",
    facility_ids: [] as number[],
  });

  async function load(p = page) {
    setErr("");
    try {
      const data = await api<{
        items: Room[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/admin/rooms?kost_id=${kostId}&page=${p}&page_size=${pageSize}`);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (e: any) {
      setErr(e?.message || "Gagal load");
    }
  }

  async function loadFacilities() {
    try {
      const data = await api<{
        items: Facility[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/admin/facilities?page=1&page_size=200`);
      setFacilities(data.items);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load(1);
    loadFacilities();
    // eslint-disable-next-line
  }, []);

  function openAdd() {
    setEdit(null);
    setForm({
      code: "",
      price_monthly: "",
      deposit: "",
      electricity_included: false,
      electricity_note: "",
      size_m2: "",
      is_available: true,
      notes: "",
      facility_ids: [],
    });
    setModalOpen(true);
  }

  function openEdit(x: Room) {
    setEdit(x);
    setForm({
      code: x.code || "",
      price_monthly: x.price_monthly?.toString() ?? "",
      deposit: x.deposit?.toString() ?? "",
      electricity_included: isTrue(x.electricity_included),
      electricity_note: x.electricity_note || "",
      size_m2: x.size_m2?.toString() ?? "",
      is_available: isTrue(x.is_available),
      notes: x.notes || "",
      facility_ids: (x.facilities || []).map((f) => f.id),
    });
    setModalOpen(true);
  }

  function toggleFacility(id: number) {
    setForm((p) => {
      const has = p.facility_ids.includes(id);
      return {
        ...p,
        facility_ids: has
          ? p.facility_ids.filter((x) => x !== id)
          : [...p.facility_ids, id],
      };
    });
  }

  async function save() {
    setErr("");
    try {
      if (!form.code.trim()) throw new Error("Kode kamar wajib diisi.");

      const payload = {
        kost_id: kostId,
        code: form.code.trim(),
        price_monthly: form.price_monthly ? Number(form.price_monthly) : null,
        deposit: form.deposit ? Number(form.deposit) : null,
        electricity_included: form.electricity_included,
        electricity_note: form.electricity_note,
        size_m2: form.size_m2 ? Number(form.size_m2) : null,
        is_available: form.is_available,
        notes: form.notes,
        facility_ids: form.facility_ids,
      };

      if (edit) {
        await api(`/api/admin/rooms/${edit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/admin/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      await load(page);
    } catch (e: any) {
      setErr(e?.message || "Gagal simpan");
    }
  }

  async function del(id: number) {
    if (!confirm("Hapus kamar?")) return;
    setErr("");
    try {
      await api(`/api/admin/rooms/${id}`, { method: "DELETE" });
      await load(page);
    } catch (e: any) {
      setErr(e?.message || "Gagal hapus");
    }
  }

  async function quickToggleAvailability(x: Room) {
    setErr("");
    try {
      await api(`/api/admin/rooms/${x.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !isTrue(x.is_available) }),
      });
      await load(page);
    } catch (e: any) {
      setErr(e?.message || "Gagal update status");
    }
  }

  return (
    <Card title="Rooms">
      {err ? (
        <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
          {err}
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-300">
          Total: <span className="font-semibold text-slate-100">{total}</span>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Deposit</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Facilities</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((x) => (
              <tr key={x.id} className="text-slate-100">
                <td className="px-4 py-3 font-semibold">{x.code}</td>
                <td className="px-4 py-3">Rp {money(x.price_monthly)}</td>
                <td className="px-4 py-3">Rp {money(x.deposit)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => quickToggleAvailability(x)}
                    className={`rounded-full px-3 py-1 text-xs ring-1 ${
                      isTrue(x.is_available)
                        ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-200 ring-red-500/20 hover:bg-red-500/20"
                    }`}
                  >
                    {isTrue(x.is_available) ? "Available" : "Not available"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {(x.facilities || []).slice(0, 4).map((f) => (
                      <span
                        key={f.id}
                        className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-200 ring-1 ring-white/10"
                      >
                        {f.name}
                      </span>
                    ))}
                    {(x.facilities || []).length > 4 ? (
                      <span className="text-xs text-slate-400">
                        +{(x.facilities || []).length - 4}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(x)}
                      className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => del(x.id)}
                      className="rounded-xl bg-red-500/10 px-3 py-2 text-red-200 ring-1 ring-red-500/20 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-300" colSpan={6}>
                  Belum ada kamar. Tambah dulu.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPage={load} />

      <Modal
        open={modalOpen}
        title={edit ? `Edit Room • ${edit.code}` : "Add Room"}
        onClose={() => setModalOpen(false)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Code (wajib)">
            <input
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
            />
          </Field>

          <Field label="Size (m²)">
            <input
              value={form.size_m2}
              onChange={(e) =>
                setForm((p) => ({ ...p, size_m2: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
              placeholder="contoh: 12.5"
            />
          </Field>

          <Field label="Price monthly">
            <input
              value={form.price_monthly}
              onChange={(e) =>
                setForm((p) => ({ ...p, price_monthly: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
              placeholder="contoh: 850000"
            />
          </Field>

          <Field label="Deposit">
            <input
              value={form.deposit}
              onChange={(e) =>
                setForm((p) => ({ ...p, deposit: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
              placeholder="contoh: 500000"
            />
          </Field>

          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_available: e.target.checked }))
                  }
                />
                <span className="text-sm text-slate-200">Available</span>
              </label>

              <label className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                <input
                  type="checkbox"
                  checked={form.electricity_included}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      electricity_included: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-slate-200">
                  Electricity included
                </span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <Field label="Electricity note">
              <input
                value={form.electricity_note}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    electricity_note: e.target.value,
                  }))
                }
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
                placeholder="misal: listrik include max 100k"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="min-h-[90px] w-full resize-y rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 text-xs text-slate-300">Facilities</div>
            <div className="max-h-44 overflow-auto rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="flex flex-wrap gap-2">
                {facilities.map((f) => {
                  const active = form.facility_ids.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFacility(f.id)}
                      className={`rounded-full px-3 py-1 text-xs ring-1 ${
                        active
                          ? "bg-indigo-500/25 text-indigo-100 ring-indigo-400/30"
                          : "bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10"
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}

                {facilities.length === 0 ? (
                  <div className="text-sm text-slate-300">
                    Facility masih kosong. Isi dulu di tab{" "}
                    <span className="font-semibold text-slate-100">
                      Facilities
                    </span>
                    .
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-2xl bg-white/5 px-4 py-2 ring-1 ring-white/10 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-2 font-semibold text-white ring-1 ring-white/10 hover:opacity-95"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

/* ===================== Nearby ===================== */
function NearbySection({ api, kostId }: { api: ApiFn; kostId: number }) {
  const [items, setItems] = useState<Nearby[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");

  const [category, setCategory] = useState<"" | Nearby["category"]>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<Nearby | null>(null);

  const [form, setForm] = useState({
    category: "laundry" as Nearby["category"],
    name: "",
    address: "",
    distance_m: "",
    maps_url: "",
    note: "",
  });

  async function load(p = page, cat = category) {
    setErr("");
    try {
      const qs =
        `kost_id=${kostId}&page=${p}&page_size=${pageSize}` +
        (cat ? `&category=${cat}` : "");
      const data = await api<{
        items: Nearby[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/admin/nearby?${qs}`);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (e: any) {
      setErr(e?.message || "Gagal load");
    }
  }

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line
  }, []);

  function openAdd() {
    setEdit(null);
    setForm({
      category: "laundry",
      name: "",
      address: "",
      distance_m: "",
      maps_url: "",
      note: "",
    });
    setModalOpen(true);
  }

  function openEdit(x: Nearby) {
    setEdit(x);
    setForm({
      category: x.category,
      name: x.name || "",
      address: x.address || "",
      distance_m: x.distance_m?.toString() ?? "",
      maps_url: x.maps_url || "",
      note: x.note || "",
    });
    setModalOpen(true);
  }

  async function save() {
    setErr("");
    try {
      if (!form.name.trim()) throw new Error("Nama tempat wajib diisi.");

      const payload = {
        kost_id: kostId,
        category: form.category,
        name: form.name.trim(),
        address: form.address,
        distance_m: form.distance_m ? Number(form.distance_m) : null,
        maps_url: form.maps_url,
        note: form.note,
      };

      if (edit) {
        await api(`/api/admin/nearby/${edit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/admin/nearby`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      await load(page, category);
    } catch (e: any) {
      setErr(e?.message || "Gagal simpan");
    }
  }

  async function del(id: number) {
    if (!confirm("Hapus nearby place?")) return;
    setErr("");
    try {
      await api(`/api/admin/nearby/${id}`, { method: "DELETE" });
      await load(page, category);
    } catch (e: any) {
      setErr(e?.message || "Gagal hapus");
    }
  }

  return (
    <Card title="Nearby Places">
      {err ? (
        <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
          {err}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-300">
          Total: <span className="font-semibold text-slate-100">{total}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
            <Filter className="h-4 w-4 text-slate-200" />
            <select
              value={category}
              onChange={(e) => {
                const v = e.target.value as "" | Nearby["category"];
                setCategory(v);
                load(1, v);
              }}
              className="bg-transparent text-sm text-slate-100 outline-none"
            >
              <option value="">All</option>
              <option value="laundry">laundry</option>
              <option value="minimarket">minimarket</option>
              <option value="makan">makan</option>
              <option value="transport">transport</option>
              <option value="lainnya">lainnya</option>
            </select>
          </div>

          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            Add Nearby
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Maps</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((x) => (
              <tr key={x.id} className="text-slate-100">
                <td className="px-4 py-3">
                  <span className="rounded-full bg-white/5 px-2 py-1 text-xs ring-1 ring-white/10">
                    {x.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{x.name}</div>
                  <div className="text-xs text-slate-400 line-clamp-1">
                    {x.address || "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {x.distance_m ? `${x.distance_m} m` : "-"}
                </td>
                <td className="px-4 py-3">
                  {x.maps_url ? (
                    <a
                      className="inline-flex items-center gap-1 text-indigo-300 hover:underline"
                      href={x.maps_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(x)}
                      className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => del(x.id)}
                      className="rounded-xl bg-red-500/10 px-3 py-2 text-red-200 ring-1 ring-red-500/20 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-300" colSpan={5}>
                  Kosong. Tambah nearby place dulu.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPage={load} />

      <Modal
        open={modalOpen}
        title={edit ? `Edit Nearby • ${edit.name}` : "Add Nearby"}
        onClose={() => setModalOpen(false)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  category: e.target.value as Nearby["category"],
                }))
              }
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
            >
              <option value="laundry">laundry</option>
              <option value="minimarket">minimarket</option>
              <option value="makan">makan</option>
              <option value="transport">transport</option>
              <option value="lainnya">lainnya</option>
            </select>
          </Field>

          <Field label="Distance (meter)">
            <input
              value={form.distance_m}
              onChange={(e) =>
                setForm((p) => ({ ...p, distance_m: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
              placeholder="contoh: 250"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Name (wajib)">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Address">
              <input
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Maps URL">
              <input
                value={form.maps_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maps_url: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
                placeholder="https://maps.app.goo.gl/..."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Note">
              <textarea
                value={form.note}
                onChange={(e) =>
                  setForm((p) => ({ ...p, note: e.target.value }))
                }
                className="min-h-[90px] w-full resize-y rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
              />
            </Field>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-2xl bg-white/5 px-4 py-2 ring-1 ring-white/10 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-2 font-semibold text-white ring-1 ring-white/10 hover:opacity-95"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

/* ===================== Rules ===================== */
function RulesSection({ api, kostId }: { api: ApiFn; kostId: number }) {
  const [items, setItems] = useState<Rule[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<Rule | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  async function load(p = page) {
    setErr("");
    try {
      const data = await api<{
        items: Rule[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/admin/rules?kost_id=${kostId}&page=${p}&page__size=${pageSize}`);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (e: any) {
      setErr(e?.message || "Gagal load");
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line
  }, []);

  function openAdd() {
    setEdit(null);
    setForm({ title: "", description: "" });
    setModalOpen(true);
  }

  function openEdit(x: Rule) {
    setEdit(x);
    setForm({
      title: x.title || "",
      description: x.description || "",
    });
    setModalOpen(true);
  }

  async function save() {
    setErr("");
    try {
      if (!form.title.trim()) throw new Error("Judul rule wajib diisi.");

      const payload = {
        kost_id: kostId,
        title: form.title.trim(),
        description: form.description,
      };

      if (edit) {
        await api(`/api/admin/rules/${edit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/admin/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      await load(page);
    } catch (e: any) {
      setErr(e?.message || "Gagal simpan");
    }
  }

  async function del(id: number) {
    if (!confirm("Hapus rule?")) return;
    setErr("");
    try {
      await api(`/api/admin/rules/${id}`, { method: "DELETE" });
      await load(page);
    } catch (e: any) {
      setErr(e?.message || "Gagal hapus");
    }
  }

  return (
    <Card title="Rules">
      {err ? (
        <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
          {err}
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-300">
          Total: <span className="font-semibold text-slate-100">{total}</span>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((x) => (
              <tr key={x.id} className="text-slate-100 align-top">
                <td className="px-4 py-3 font-semibold">{x.title}</td>
                <td className="px-4 py-3">
                  <div className="text-slate-200 line-clamp-2">
                    {x.description || "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(x)}
                      className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => del(x.id)}
                      className="rounded-xl bg-red-500/10 px-3 py-2 text-red-200 ring-1 ring-red-500/20 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-300" colSpan={3}>
                  Kosong. Tambah rule dulu.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPage={load} />

      <Modal
        open={modalOpen}
        title={edit ? `Edit Rule • ${edit.title}` : "Add Rule"}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <Field label="Title (wajib)">
            <input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="min-h-[120px] w-full resize-y rounded-2xl bg-white/5 px-4 py-3 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-indigo-400/50"
            />
          </Field>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-2xl bg-white/5 px-4 py-2 ring-1 ring-white/10 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 px-4 py-2 font-semibold text-white ring-1 ring-white/10 hover:opacity-95"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
