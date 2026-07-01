"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <nav className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
      <Link href="/" className="text-lg font-semibold tracking-tight text-white">
        cutShort
      </Link>

      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <span className="text-zinc-400 hidden sm:block">{user.displayName}</span>
            <Link
              href="/dashboard"
              className="text-zinc-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-zinc-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md transition-colors"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
