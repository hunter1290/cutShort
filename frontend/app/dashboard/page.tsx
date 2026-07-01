"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { urls, type UrlEntry } from "@/lib/api";

// ── SVG donut helper ──────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlice(
  cx: number, cy: number,
  outerR: number, innerR: number,
  start: number, end: number
): string {
  if (end - start >= 360) end = start + 359.99;
  const o1 = polar(cx, cy, outerR, start);
  const o2 = polar(cx, cy, outerR, end);
  const i1 = polar(cx, cy, innerR, start);
  const i2 = polar(cx, cy, innerR, end);
  const lg = end - start > 180 ? 1 : 0;
  return `M${o1.x} ${o1.y} A${outerR} ${outerR} 0 ${lg} 1 ${o2.x} ${o2.y} L${i2.x} ${i2.y} A${innerR} ${innerR} 0 ${lg} 0 ${i1.x} ${i1.y}Z`;
}

// ── Date utils ────────────────────────────────────────────────────────────────

function daysFromNow(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function daysSince(dateStr: string): number {
  return Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000));
}

// ── Analytics sub-components ──────────────────────────────────────────────────

function StatCard({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ClicksBarChart({ links }: { links: UrlEntry[] }) {
  const sorted = [...links].sort((a, b) => b.clickCount - a.clickCount).slice(0, 8);
  const max = sorted[0]?.clickCount ?? 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">Clicks per URL</p>
      {max === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-6">No clicks recorded yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((link) => (
            <div key={link.id} className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-400 w-24 truncate shrink-0">{link.shortCode}</span>
              <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${max > 0 ? (link.clickCount / max) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-6 text-right shrink-0">{link.clickCount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDonut({ links }: { links: UrlEntry[] }) {
  const now = Date.now();
  const noExpiry  = links.filter((l) => !l.expiresAt).length;
  const expired   = links.filter((l) => l.expiresAt && new Date(l.expiresAt).getTime() < now).length;
  const active    = links.length - noExpiry - expired;
  const total     = links.length;

  const segments = [
    { label: "Permanent",        count: noExpiry, color: "#3b82f6" },
    { label: "Active (expiring)", count: active,   color: "#22c55e" },
    { label: "Expired",          count: expired,  color: "#ef4444" },
  ].filter((s) => s.count > 0);

  let angle = 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">Link status</p>
      {total === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-6">No links yet</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
            {segments.map((seg) => {
              const sweep = (seg.count / total) * 360;
              const d = donutSlice(60, 60, 54, 32, angle, angle + sweep);
              angle += sweep;
              return <path key={seg.label} d={d} fill={seg.color} />;
            })}
            <text x="60" y="57" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{total}</text>
            <text x="60" y="70" textAnchor="middle" fill="#71717a" fontSize="9">links</text>
          </svg>
          <div className="flex flex-col gap-2.5">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-xs text-zinc-400">{seg.label}</span>
                <span className="text-xs font-medium text-zinc-300 ml-1">{seg.count}</span>
                <span className="text-xs text-zinc-600">({Math.round((seg.count / total) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const FREE_LIMIT = 50;

function QuotaBar({ count }: { count: number }) {
  const pct = Math.min((count / FREE_LIMIT) * 100, 100);
  const bar  = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-yellow-500" : "bg-green-500";
  const text = pct >= 80 ? "text-red-400" : pct >= 50 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-semibold text-white">Link creation quota</p>
        <span className={`text-sm font-bold ${text}`}>{count} <span className="text-zinc-500 font-normal text-xs">/ {FREE_LIMIT} free</span></span>
      </div>
      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-zinc-600">{FREE_LIMIT - count} link{FREE_LIMIT - count !== 1 ? "s" : ""} remaining on the free tier</p>
    </div>
  );
}

function ExpiryTimeline({ links }: { links: UrlEntry[] }) {
  const withExpiry = [...links]
    .filter((l) => l.expiresAt)
    .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())
    .slice(0, 8);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">Expiry timeline</p>
      {withExpiry.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-6">No links with expiry dates</p>
      ) : (
        <div className="flex flex-col gap-4">
          {withExpiry.map((link) => {
            const days     = daysFromNow(link.expiresAt)!;
            const isExpired = days < 0;
            const isCrit    = !isExpired && days <= 3;
            const isWarn    = !isExpired && !isCrit && days <= 14;

            const barColor  = isExpired ? "bg-red-600" : isCrit ? "bg-orange-500" : isWarn ? "bg-yellow-500" : "bg-green-500";
            const labelColor = isExpired ? "text-red-400" : isCrit ? "text-orange-400" : "text-zinc-500";

            const created = new Date(link.createdAt).getTime();
            const expires = new Date(link.expiresAt!).getTime();
            const pct     = Math.min(Math.max(((Date.now() - created) / (expires - created)) * 100, 0), 100);

            return (
              <div key={link.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs text-zinc-400">{link.shortCode}</span>
                  <span className={`text-xs ${labelColor}`}>
                    {isExpired ? `Expired ${Math.abs(days)}d ago` : `${days}d remaining`}
                  </span>
                </div>
                <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`absolute inset-y-0 left-0 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-zinc-700">{new Date(link.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs text-zinc-700">{new Date(link.expiresAt!).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UrlMetricsTable({ links }: { links: UrlEntry[] }) {
  const isCustom = (code: string) => !/^[a-zA-Z0-9]{7}$/.test(code);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">URL shortening metrics</p>
      {links.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-6">No links yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="text-zinc-600 border-b border-zinc-800 text-left">
                <th className="pb-2 pr-4 font-medium">Code</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium text-right">Clicks</th>
                <th className="pb-2 pr-4 font-medium text-right">Clicks/day</th>
                <th className="pb-2 pr-4 font-medium text-right">Days alive</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const alive  = daysSince(link.createdAt);
                const rate   = (link.clickCount / alive).toFixed(1);
                const days   = daysFromNow(link.expiresAt);
                const expired = days !== null && days < 0;
                const custom  = isCustom(link.shortCode);

                return (
                  <tr key={link.id} className="border-b border-zinc-800/40 text-zinc-400 hover:text-zinc-300">
                    <td className="py-2.5 pr-4 font-mono text-blue-400">{link.shortCode}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${custom ? "bg-purple-900/40 text-purple-400 border border-purple-700/40" : "bg-zinc-800 text-zinc-500"}`}>
                        {custom ? "custom" : "auto"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">{link.clickCount}</td>
                    <td className="py-2.5 pr-4 text-right">{rate}</td>
                    <td className="py-2.5 pr-4 text-right">{alive}</td>
                    <td className="py-2.5">
                      {expired    ? <span className="text-red-400">Expired</span>
                       : days === null ? <span className="text-blue-400">Permanent</span>
                       : days <= 3 ? <span className="text-orange-400">Expiring soon</span>
                       : <span className="text-green-400">Active</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsPanel({ links }: { links: UrlEntry[] }) {
  const now = Date.now();
  const totalClicks   = links.reduce((s, l) => s + l.clickCount, 0);
  const expiringSoon  = links.filter((l) => { const d = daysFromNow(l.expiresAt); return d !== null && d >= 0 && d <= 7; }).length;
  const expiredCount  = links.filter((l) => l.expiresAt && new Date(l.expiresAt).getTime() < now).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total links" value={links.length} />
        <StatCard label="Total clicks" value={totalClicks} color="text-blue-400" />
        <StatCard label="Expiring in 7d" value={expiringSoon} color={expiringSoon > 0 ? "text-orange-400" : "text-white"} />
        <StatCard label="Expired" value={expiredCount} color={expiredCount > 0 ? "text-red-400" : "text-white"} />
      </div>

      {/* Quota */}
      <QuotaBar count={links.length} />

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ClicksBarChart links={links} />
        <StatusDonut links={links} />
      </div>

      {/* Expiry timeline */}
      <ExpiryTimeline links={links} />

      {/* Per-URL metrics table */}
      <UrlMetricsTable links={links} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

const GHOST_LINKS = [
  { shortUrl: "https://cut.short/xK9mPqR",  originalUrl: "https://docs.example.com/getting-started/installation-guide", clickCount: 142, expiresAt: null,         shortCode: "xK9mPqR", createdAt: "2025-01-01" },
  { shortUrl: "https://cut.short/my-brand", originalUrl: "https://www.notion.so/team/product-roadmap-2025-q3-review",   clickCount: 37,  expiresAt: "2025-09-30", shortCode: "my-brand", createdAt: "2025-06-01" },
  { shortUrl: "https://cut.short/aB3cDeF",  originalUrl: "https://github.com/org/repo/pull/284/files?diff=unified",    clickCount: 8,   expiresAt: "2025-08-15", shortCode: "aB3cDeF", createdAt: "2025-07-01" },
];

function EmptyState() {
  return (
    <div>
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 text-zinc-500 mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-300 mb-1">No links yet</p>
        <p className="text-xs text-zinc-500 mb-5">Shorten your first URL and it will appear here.</p>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Shorten a URL
        </a>
      </div>

      <div className="mt-2 mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-600">Preview — this is what your links will look like</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <div className="flex flex-col gap-3 pointer-events-none select-none opacity-40">
        {GHOST_LINKS.map((link) => (
          <div key={link.shortUrl} className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="text-blue-400 font-mono text-sm">{link.shortUrl}</span>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{link.originalUrl}</p>
              </div>
              <span className="text-xs text-zinc-400 shrink-0">{link.clickCount} clicks</span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {link.expiresAt
                ? <span className="text-xs text-zinc-500">Expires {new Date(link.expiresAt).toLocaleDateString()}</span>
                : <span className="text-xs text-zinc-600">No expiry</span>}
              <div className="ml-auto flex gap-2">
                <span className="text-xs border border-zinc-700 text-zinc-400 px-3 py-1 rounded-md">Extend expiry</span>
                <span className="text-xs border border-zinc-700 text-zinc-400 px-3 py-1 rounded-md">Customize code</span>
                <span className="text-xs text-red-500 border border-zinc-800 px-3 py-1 rounded-md">Delete</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [links, setLinks] = useState<UrlEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"links" | "analytics">("links");

  const [extendTarget, setExtendTarget] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [customizeTarget, setCustomizeTarget] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [actionError, setActionError] = useState("");

  const loadLinks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await urls.list(user.token);
      setLinks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load links");
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadLinks();
  }, [user, loadLinks]);

  async function handleDelete(code: string) {
    if (!user) return;
    try {
      await urls.delete(code, user.token);
      setLinks((prev) => prev.filter((l) => l.shortCode !== code));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleExtend() {
    if (!user || !extendTarget) return;
    setActionError("");
    try {
      const updated = await urls.extendExpiry(extendTarget, parseInt(extendDays), user.token);
      setLinks((prev) => prev.map((l) => (l.shortCode === extendTarget ? updated : l)));
      setExtendTarget(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to extend");
    }
  }

  async function handleCustomize() {
    if (!user || !customizeTarget) return;
    setActionError("");
    try {
      const updated = await urls.customize(customizeTarget, newCode, user.token);
      setLinks((prev) => prev.map((l) => (l.shortCode === customizeTarget ? updated : l)));
      setCustomizeTarget(null);
      setNewCode("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to change code");
    }
  }

  if (authLoading || fetching) {
    return <p className="text-center mt-24 text-zinc-500 text-sm">Loading…</p>;
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">

      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My links</h1>
        <span className="text-sm text-zinc-500">{links.length} link{links.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-6 w-fit">
        {(["links", "analytics"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {/* Links tab */}
      {tab === "links" && (
        links.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <div key={link.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <a
                      href={link.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                    >
                      {link.shortUrl}
                    </a>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{link.originalUrl}</p>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">{link.clickCount} clicks</span>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {link.expiresAt
                    ? <span className="text-xs text-zinc-500">Expires {new Date(link.expiresAt).toLocaleDateString()}</span>
                    : <span className="text-xs text-zinc-600">No expiry</span>}

                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => { setExtendTarget(link.shortCode); setActionError(""); }}
                      className="text-xs border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-3 py-1 rounded-md transition-colors"
                    >
                      Extend expiry
                    </button>
                    <button
                      onClick={() => { setCustomizeTarget(link.shortCode); setNewCode(""); setActionError(""); }}
                      className="text-xs border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-3 py-1 rounded-md transition-colors"
                    >
                      Customize code
                    </button>
                    <button
                      onClick={() => handleDelete(link.shortCode)}
                      className="text-xs text-red-500 hover:text-red-400 border border-zinc-800 hover:border-red-900 px-3 py-1 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Analytics tab */}
      {tab === "analytics" && <AnalyticsPanel links={links} />}

      {/* Extend modal */}
      {extendTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold mb-1">Extend expiry</h2>
            <p className="text-xs text-zinc-500 mb-4">Code: <span className="font-mono">{extendTarget}</span></p>
            <label className="block text-xs text-zinc-400 mb-1.5">Days to add</label>
            <input
              type="number" min={1} max={365}
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 mb-3"
            />
            {actionError && <p className="text-xs text-red-400 mb-3">{actionError}</p>}
            <div className="flex gap-2">
              <button onClick={handleExtend} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm transition-colors">Extend</button>
              <button onClick={() => setExtendTarget(null)} className="flex-1 border border-zinc-700 text-zinc-300 py-2 rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Customize modal */}
      {customizeTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold mb-1">Change short code</h2>
            <p className="text-xs text-zinc-500 mb-4">Current: <span className="font-mono">{customizeTarget}</span></p>
            <label className="block text-xs text-zinc-400 mb-1.5">New code</label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="my-brand"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 mb-1"
            />
            <p className="text-xs text-zinc-600 mb-3">3–30 alphanumeric characters, hyphens, underscores</p>
            {actionError && <p className="text-xs text-red-400 mb-3">{actionError}</p>}
            <div className="flex gap-2">
              <button onClick={handleCustomize} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm transition-colors">Save</button>
              <button onClick={() => setCustomizeTarget(null)} className="flex-1 border border-zinc-700 text-zinc-300 py-2 rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
