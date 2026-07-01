"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await auth.register(form);
      login(data);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 pt-20">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Create an account</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Already have one?{" "}
        <Link href="/login" className="text-blue-400 hover:text-blue-300">
          Log in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Display name</label>
          <input
            type="text"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

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
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="mt-1 text-xs text-zinc-500">Minimum 8 characters</p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-1"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
