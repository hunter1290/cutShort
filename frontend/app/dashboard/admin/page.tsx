"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { admin, type AdminUserSummary, type AdminUserDetail, type AdminStats } from "@/lib/api";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── User side pane row ────────────────────────────────────────────────────────

function UserRow({
  u, selected, onClick,
}: { u: AdminUserSummary; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors border ${
        selected
          ? "bg-zinc-800 border-zinc-700"
          : "border-transparent hover:bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-white truncate">{u.displayName}</span>
        {u.role === "ADMIN" && (
          <span className="text-[10px] shrink-0 bg-purple-900/40 text-purple-400 border border-purple-700/40 px-1.5 py-0.5 rounded">
            admin
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 truncate">{u.email}</p>
      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
        <span>{u.urlCount} link{u.urlCount !== 1 ? "s" : ""}</span>
        <span>{u.totalClicks} click{u.totalClicks !== 1 ? "s" : ""}</span>
      </div>
    </button>
  );
}

// ── User detail panel ─────────────────────────────────────────────────────────

function UserDetailPanel({
  detail, onDelete, onPromote, deleting, promoting, isSelf,
}: {
  detail: AdminUserDetail;
  onDelete: () => void;
  onPromote: () => void;
  deleting: boolean;
  promoting: boolean;
  isSelf: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{detail.displayName}</h2>
            {detail.role === "ADMIN" && (
              <span className="text-[10px] bg-purple-900/40 text-purple-400 border border-purple-700/40 px-1.5 py-0.5 rounded">
                admin
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500">{detail.email}</p>
          <p className="text-xs text-zinc-600 mt-1">
            Joined {new Date(detail.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {detail.role !== "ADMIN" && (
            <button
              onClick={onPromote}
              disabled={promoting}
              className="text-xs border border-zinc-700 hover:border-purple-600 text-zinc-400 hover:text-purple-300 disabled:opacity-50 px-3 py-1.5 rounded-md transition-colors"
            >
              {promoting ? "Promoting…" : "Promote to admin"}
            </button>
          )}
          {!isSelf && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-xs text-red-500 hover:text-red-400 border border-zinc-800 hover:border-red-900 disabled:opacity-50 px-3 py-1.5 rounded-md transition-colors"
            >
              {deleting ? "Removing…" : "Remove user"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Links created" value={detail.urlCount} />
        <StatCard label="Total clicks" value={detail.totalClicks} color="text-blue-400" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Links</p>
        {detail.urls.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">No links yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="text-zinc-600 border-b border-zinc-800 text-left">
                  <th className="pb-2 pr-4 font-medium">Code</th>
                  <th className="pb-2 pr-4 font-medium">Destination</th>
                  <th className="pb-2 pr-4 font-medium text-right">Clicks</th>
                  <th className="pb-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {detail.urls.map((link) => (
                  <tr key={link.id} className="border-b border-zinc-800/40 text-zinc-400">
                    <td className="py-2.5 pr-4 font-mono text-blue-400">{link.shortCode}</td>
                    <td className="py-2.5 pr-4 truncate max-w-[220px]">{link.originalUrl}</td>
                    <td className="py-2.5 pr-4 text-right">{link.clickCount}</td>
                    <td className="py-2.5">{new Date(link.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userList, setUserList] = useState<AdminUserSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);

  const [fetching, setFetching] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!user) return;
    try {
      const [s, u] = await Promise.all([admin.stats(user.token), admin.listUsers(user.token)]);
      setStats(s);
      setUserList(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) router.replace("/dashboard");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && user.role === "ADMIN") loadOverview();
  }, [user, loadOverview]);

  async function selectUser(id: string) {
    if (!user) return;
    setSelectedId(id);
    setDetailLoading(true);
    setError("");
    try {
      const d = await admin.getUser(id, user.token);
      setDetail(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    setDeleting(true);
    try {
      await admin.deleteUser(id, user.token);
      setUserList((prev) => prev.filter((u) => u.id !== id));
      setStats((prev) => (prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : prev));
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setDeleting(false);
    }
  }

  async function handlePromote() {
    if (!user || !selectedId) return;
    setPromoting(true);
    try {
      const updated = await admin.promoteUser(selectedId, user.token);
      setUserList((prev) => prev.map((u) => (u.id === selectedId ? updated : u)));
      setDetail((prev) => (prev ? { ...prev, role: updated.role } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote user");
    } finally {
      setPromoting(false);
    }
  }

  if (authLoading || fetching) {
    return <p className="text-center mt-24 text-zinc-500 text-sm">Loading…</p>;
  }

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-24">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin dashboard</h1>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="Admins" value={stats.totalAdmins} color="text-purple-400" />
          <StatCard label="Total links" value={stats.totalUrls} />
          <StatCard label="Total clicks" value={stats.totalClicks} color="text-blue-400" />
        </div>
      )}

      <div className="flex gap-6">
        {/* Side pane: user list */}
        <aside className="w-72 shrink-0">
          <p className="text-xs text-zinc-500 mb-2 px-1">{userList.length} user{userList.length !== 1 ? "s" : ""}</p>
          <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-1">
            {userList.map((u) => (
              <UserRow key={u.id} u={u} selected={u.id === selectedId} onClick={() => selectUser(u.id)} />
            ))}
          </div>
        </aside>

        {/* Main: selected user detail */}
        <main className="flex-1 min-w-0">
          {!selectedId && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
              <p className="text-sm text-zinc-500">Select a user from the list to see their metrics.</p>
            </div>
          )}

          {selectedId && detailLoading && (
            <p className="text-sm text-zinc-500">Loading user…</p>
          )}

          {selectedId && !detailLoading && detail && (
            <UserDetailPanel
              detail={detail}
              deleting={deleting}
              promoting={promoting}
              isSelf={detail.email === user.email}
              onDelete={() => setConfirmDeleteId(detail.id)}
              onPromote={handlePromote}
            />
          )}
        </main>
      </div>

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold mb-1">Remove this user?</h2>
            <p className="text-xs text-zinc-500 mb-4">
              This permanently deletes the account and all of their links. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-zinc-700 text-zinc-300 py-2 rounded-lg text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
