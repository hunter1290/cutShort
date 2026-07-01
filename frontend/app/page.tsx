"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { urls, type UrlEntry } from "@/lib/api";
import Link from "next/link";

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconLink() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconLayout() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Feature card data ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <IconZap />,
    title: "Instant shortening",
    body: "Paste any URL and get a short link in under a second — no account required.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: <IconPencil />,
    title: "Custom slugs",
    body: "Pick your own short code — /my-brand instead of a random string.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: <IconSparkles />,
    title: "Gemini-powered suggestions",
    body: "As you paste a URL, Gemini 2.5 Flash suggests memorable slugs based on the destination — sign in to use one instantly.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  {
    icon: <IconClock />,
    title: "Expiry control",
    body: "Set exact expiry dates or extend links anytime. Anonymous links last 7 days by default.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: <IconBarChart />,
    title: "Click analytics",
    body: "See exactly how many times each link has been clicked, right from your dashboard.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: <IconLayout />,
    title: "Link dashboard",
    body: "Manage all your links in one place — edit, extend, customize, or delete in a click.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icon: <IconShield />,
    title: "Secure by default",
    body: "Token-based auth keeps your links private. Only you can manage the links you create.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Paste your URL",
    body: "Drop any long URL into the box — works with any website.",
  },
  {
    n: "2",
    title: "Get a short link",
    body: "We generate a clean short link instantly, ready to share anywhere.",
  },
  {
    n: "3",
    title: "Share & track",
    body: "Send the link and watch the click count climb in your dashboard.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<UrlEntry | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gemini-powered slug suggestions, debounced off the URL input.
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestRequestId = useRef(0);

  useEffect(() => {
    setSuggestions([]);

    let candidateUrl: URL;
    try {
      candidateUrl = new URL(input);
    } catch {
      return; // not a parseable URL yet — don't call Gemini on every keystroke
    }
    if (!/^https?:$/.test(candidateUrl.protocol)) return;

    const requestId = ++suggestRequestId.current;
    setSuggestLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { suggestions: ideas } = await urls.suggestCode(input);
        if (suggestRequestId.current === requestId) setSuggestions(ideas);
      } catch {
        // Gemini being unavailable is never user-facing here — suggestions just stay empty.
      } finally {
        if (suggestRequestId.current === requestId) setSuggestLoading(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [input]);

  async function shorten(customCode?: string) {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const entry = await urls.shorten({ originalUrl: input, customCode }, user?.token);
      setResult(entry);
      setSuggestions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleShorten(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await shorten();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-6 pt-24 pb-20 text-center">
        <div className="max-w-3xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Free to use · No credit card required
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-5">
            Short links that{" "}
            <span className="text-blue-400">work for you</span>
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Paste any URL, get a clean short link instantly. Sign up to unlock
            custom slugs, expiry control, and a full management dashboard.
          </p>

          {/* Shortener form */}
          <form onSubmit={handleShorten} className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <input
              type="url"
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com/a-very-long-url"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
            >
              {loading ? "Shortening…" : "Shorten URL"}
            </button>
          </form>

          {/* Gemini-powered slug suggestions */}
          {!result && (suggestLoading || suggestions.length > 0) && (
            <div className="mt-3 max-w-xl mx-auto text-left">
              <div className="flex items-center gap-1.5 text-xs text-violet-400 mb-2">
                <IconSparkles />
                {suggestLoading ? "Asking Gemini for slug ideas…" : "Gemini suggestions"}
              </div>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={!user || loading}
                      title={user ? `Shorten with /${s}` : "Sign in to use a custom slug"}
                      onClick={() => shorten(s)}
                      className="font-mono text-xs bg-violet-400/10 border border-violet-400/20 text-violet-300 hover:bg-violet-400/20 disabled:opacity-50 disabled:hover:bg-violet-400/10 px-3 py-1.5 rounded-full transition-colors"
                    >
                      /{s}
                    </button>
                  ))}
                </div>
              )}
              {!user && suggestions.length > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  <Link href="/register" className="text-blue-400 hover:text-blue-300">Sign in</Link> to shorten with one of these instead of a random code.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-400 text-left max-w-xl mx-auto">{error}</p>
          )}

          {/* Result card */}
          {result && (
            <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-lg p-4 max-w-xl mx-auto text-left">
              <p className="text-xs text-zinc-500 mb-2">Your short link is ready</p>
              <div className="flex items-center gap-3">
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-sm flex-1 truncate"
                >
                  {result.shortUrl}
                </a>
                <button
                  onClick={() => copyToClipboard(result.shortUrl)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-md transition-colors"
                >
                  {copied ? <IconCheck /> : <IconCopy />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {result.expiresAt && (
                <p className="mt-2 text-xs text-zinc-500">
                  Expires {new Date(result.expiresAt).toLocaleDateString()}.{" "}
                  {!user && (
                    <Link href="/register" className="text-blue-400 hover:text-blue-300">
                      Sign up to extend or remove the expiry →
                    </Link>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Anonymous nudge */}
          {!user && !result && (
            <p className="mt-4 text-xs text-zinc-500">
              Anonymous links expire in 7 days.{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300">
                Create a free account
              </Link>{" "}
              for permanent links and more.
            </p>
          )}
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-zinc-800 py-6">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap justify-center gap-x-12 gap-y-4 text-center">
          {[
            { label: "Links shortened", value: "Unlimited" },
            { label: "Setup time", value: "< 30 sec" },
            { label: "Account required", value: "Optional" },
            { label: "Price", value: "Free" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Everything you need to manage links
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              From one-shot shortening to a full link management suite — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group"
              >
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${f.bg} ${f.color} mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
            <p className="text-zinc-400">Three steps. Under ten seconds.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* connector line on desktop */}
            <div className="hidden sm:block absolute top-5 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-zinc-800" />

            {STEPS.map((s) => (
              <div key={s.n} className="text-center relative">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 text-blue-400 font-bold text-sm mb-4 relative z-10">
                  {s.n}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free vs Signed-in comparison ──────────────────────────────────── */}
      <section className="px-6 py-16 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Free vs. signed-in</h2>
            <p className="text-zinc-400">You can always start without an account.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Anonymous */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mb-4">Anonymous</p>
              <ul className="space-y-3">
                {[
                  "Shorten any URL instantly",
                  "Short link works immediately",
                  "Links expire after 7 days",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <span className="text-green-400 mt-0.5 shrink-0"><IconCheck /></span>
                    {item}
                  </li>
                ))}
                {[
                  "No custom slugs",
                  "No expiry control",
                  "No click analytics",
                  "No dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-500">
                    <span className="mt-0.5 shrink-0 opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Signed in */}
            <div className="bg-blue-950/40 border border-blue-700/40 rounded-xl p-6">
              <p className="text-xs text-blue-400 font-medium uppercase tracking-widest mb-4">Signed in · Free</p>
              <ul className="space-y-3">
                {[
                  "Everything in anonymous",
                  "Custom slugs (/your-brand)",
                  "Set any expiry date",
                  "Extend links at any time",
                  "Track click counts per link",
                  "Full management dashboard",
                  "Delete links anytime",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-200">
                    <span className="text-blue-400 mt-0.5 shrink-0"><IconCheck /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      {!user && (
        <section className="px-6 py-20 border-t border-zinc-800">
          <div className="max-w-xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 mb-6">
              <IconLink />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Ready to take control of your links?
            </h2>
            <p className="text-zinc-400 mb-8">
              Create a free account in seconds. No credit card, no catch.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
              >
                Create free account
                <IconArrowRight />
              </Link>
              <Link
                href="/login"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <span className="font-semibold text-zinc-500">cutShort</span>
          <span>Shorten smarter. Track better.</span>
        </div>
      </footer>

    </div>
  );
}
