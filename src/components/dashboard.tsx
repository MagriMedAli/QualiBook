"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Filter,
  LayoutDashboard,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardStats, Lead, LeadStage } from "@/lib/types";

const stageStyles: Record<LeadStage, string> = {
  new: "bg-slate-100 text-slate-700",
  qualifying: "bg-amber-100 text-amber-800",
  qualified: "bg-emerald-100 text-emerald-800",
  unqualified: "bg-rose-100 text-rose-800",
  booked: "bg-violet-100 text-violet-800",
};

function formatStage(stage: string) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(name: string | null, contactId: string) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return contactId.slice(-2).toUpperCase();
}

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<"all" | LeadStage>("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    setError("");
    try {
      const leadParams = new URLSearchParams();
      if (search.trim()) leadParams.set("search", search.trim());
      if (stage !== "all") leadParams.set("stage", stage);

      const [leadResponse, statsResponse] = await Promise.all([
        fetch(`/api/leads?${leadParams.toString()}`, { cache: "no-store" }),
        fetch("/api/stats", { cache: "no-store" }),
      ]);

      const leadData = await leadResponse.json();
      const statsData = await statsResponse.json();

      if (!leadResponse.ok) throw new Error(leadData.error || "Failed to load leads");
      if (!statsResponse.ok) throw new Error(statsData.error || "Failed to load stats");

      setLeads(leadData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    const timer = window.setInterval(() => void loadDashboard(), 15_000);
    return () => window.clearInterval(timer);
  }, [search, stage]);

  const upcoming = useMemo(() => {
    return leads
      .filter((lead) => lead.meeting_time && new Date(lead.meeting_time).getTime() >= Date.now())
      .sort((a, b) => new Date(a.meeting_time!).getTime() - new Date(b.meeting_time!).getTime())
      .slice(0, 5);
  }, [leads]);

  async function saveLead(updated: Lead) {
    const response = await fetch(`/api/leads/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to update lead");

    setLeads((current) => current.map((lead) => (lead.id === data.id ? data : lead)));
    setSelected(data);
    await loadDashboard(true);
  }

  if (loading && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">L</div>
            <div>
              <p className="font-semibold text-slate-950">LeadOps</p>
              <p className="text-xs text-slate-500">Agency dashboard</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            <div className="flex items-center gap-3 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-medium text-white">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500">
              <Users className="h-4 w-4" />
              Leads
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Meetings
            </div>
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Live agent</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              WhatsApp automation online
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Real estate operations</p>
                <h1 className="text-xl font-semibold tracking-tight text-slate-950">Lead qualification overview</h1>
              </div>
              <button
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-6 px-5 py-6 md:px-8">
            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <CircleAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total leads" value={stats?.total ?? 0} helper="All leads in the pipeline" icon={<Users className="h-5 w-5" />} />
              <StatCard label="Qualified" value={stats?.qualified ?? 0} helper={`${stats?.qualifiedRate ?? 0}% of all leads`} icon={<Target className="h-5 w-5" />} />
              <StatCard label="Booked" value={stats?.booked ?? 0} helper={`${stats?.meetingsThisWeek ?? 0} meeting(s) this week`} icon={<CalendarDays className="h-5 w-5" />} />
              <StatCard label="Still qualifying" value={stats?.qualifying ?? 0} helper="Conversations in progress" icon={<Clock3 className="h-5 w-5" />} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-950">Pipeline</h2>
                    <p className="mt-1 text-sm text-slate-500">Current lead distribution by stage</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 text-slate-500">
                    <Target className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.stages ?? []}>
                      <defs>
                        <linearGradient id="pipelineFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f172a" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#0f172a" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                      <XAxis dataKey="name" tickFormatter={formatStage} tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip formatter={(value) => [value, "Leads"]} labelFormatter={(label) => formatStage(String(label))} />
                      <Area type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={2} fill="url(#pipelineFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-950">Upcoming meetings</h2>
                    <p className="mt-1 text-sm text-slate-500">Next booked slots</p>
                  </div>
                  <CalendarDays className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-5 space-y-3">
                  {upcoming.length ? (
                    upcoming.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelected(lead)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-sm font-semibold text-violet-700">
                          {initials(lead.name, lead.contact_id)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{lead.name || lead.contact_id}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDate(lead.meeting_time)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No upcoming meetings found.</div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-950">Leads</h2>
                    <p className="mt-1 text-sm text-slate-500">Manage qualification state and booking information.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name, phone, area"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 sm:w-72"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={stage}
                        onChange={(event) => setStage(event.target.value as "all" | LeadStage)}
                        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm outline-none focus:border-slate-400 sm:w-44"
                      >
                        <option value="all">All stages</option>
                        <option value="new">New</option>
                        <option value="qualifying">Qualifying</option>
                        <option value="qualified">Qualified</option>
                        <option value="booked">Booked</option>
                        <option value="unqualified">Unqualified</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Lead</th>
                      <th className="px-5 py-3 font-medium">Intent</th>
                      <th className="px-5 py-3 font-medium">Budget</th>
                      <th className="px-5 py-3 font-medium">Area</th>
                      <th className="px-5 py-3 font-medium">Stage</th>
                      <th className="px-5 py-3 font-medium">Meeting</th>
                      <th className="px-5 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <button onClick={() => setSelected(lead)} className="flex items-center gap-3 text-left">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                              {initials(lead.name, lead.contact_id)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{lead.name || "Unnamed lead"}</p>
                              <p className="mt-1 text-xs text-slate-500">{lead.contact_id}</p>
                            </div>
                          </button>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{lead.intent || "—"}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{lead.budget || "—"}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{lead.area || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stageStyles[lead.stage]}`}>
                            {formatStage(lead.stage)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDate(lead.meeting_time)}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => setSelected(lead)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!leads.length && (
                  <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">No leads match the current filters.</div>
                )}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
                  <div><p className="text-sm font-semibold text-slate-800">Qualified</p><p className="text-xs text-slate-500">Ready for sales follow-up</p></div>
                </div>
                <p className="mt-4 text-2xl font-semibold text-slate-950">{stats?.qualified ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-700"><MessageSquareText className="h-5 w-5" /></div>
                  <div><p className="text-sm font-semibold text-slate-800">In conversation</p><p className="text-xs text-slate-500">Qualification not finished</p></div>
                </div>
                <p className="mt-4 text-2xl font-semibold text-slate-950">{stats?.qualifying ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><CalendarDays className="h-5 w-5" /></div>
                  <div><p className="text-sm font-semibold text-slate-800">Meetings booked</p><p className="text-xs text-slate-500">Across all current leads</p></div>
                </div>
                <p className="mt-4 text-2xl font-semibold text-slate-950">{stats?.booked ?? 0}</p>
              </div>
            </section>
          </div>
        </main>
      </div>

      {selected && (
        <LeadPanel lead={selected} onClose={() => setSelected(null)} onSave={saveLead} />
      )}
    </div>
  );
}

function LeadPanel({
  lead,
  onClose,
  onSave,
}: {
  lead: Lead;
  onClose: () => void;
  onSave: (lead: Lead) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Lead>(lead);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => setDraft(lead), [lead]);

  const update = (key: keyof Lead, value: string | boolean | null) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close" className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Lead details</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{lead.name || "Unnamed lead"}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {saveError && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{saveError}</div>}

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-slate-400">Contact ID</p><p className="mt-1 font-medium text-slate-800">{lead.contact_id}</p></div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stageStyles[draft.stage]}`}>{formatStage(draft.stage)}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Last updated {formatDate(draft.updated_at)}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={draft.name || ""} onChange={(v) => update("name", v)} />
            <Field label="Phone / Contact ID" value={draft.contact_id} disabled onChange={() => undefined} />
            <Field label="Budget" value={draft.budget || ""} onChange={(v) => update("budget", v)} />
            <Field label="Area" value={draft.area || ""} onChange={(v) => update("area", v)} />
            <Field label="Intent" value={draft.intent || ""} onChange={(v) => update("intent", v)} />
            <Field label="Timeline" value={draft.timeline || ""} onChange={(v) => update("timeline", v)} />
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Stage</label>
              <select value={draft.stage} onChange={(e) => update("stage", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400">
                <option value="new">New</option>
                <option value="qualifying">Qualifying</option>
                <option value="qualified">Qualified</option>
                <option value="booked">Booked</option>
                <option value="unqualified">Unqualified</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Qualified</label>
              <select
                value={draft.qualified === null ? "null" : draft.qualified ? "true" : "false"}
                onChange={(e) => update("qualified", e.target.value === "null" ? null : e.target.value === "true")}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="null">Not set</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Meeting time</label>
            <input
              type="datetime-local"
              value={draft.meeting_time ? toDatetimeLocal(draft.meeting_time) : ""}
              onChange={(e) => update("meeting_time", e.target.value || null)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Last message</label>
            <textarea
              value={draft.last_message || ""}
              onChange={(e) => update("last_message", e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 p-5">
          <button onClick={() => void handleSave()} disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</label>
      <input disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400" />
    </div>
  );
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
