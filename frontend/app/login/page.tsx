"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await auth.login(form);
      login(data);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 pt-20">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Log in</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-400 hover:text-blue-300">
          Sign up
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-1"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
