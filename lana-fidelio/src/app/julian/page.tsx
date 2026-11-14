"use client";

import { useState, type FormEvent } from "react";
import { kingdomCopy } from "@/lib/story";

type Latest = { choice: "sea" | "balance"; id: string; at: string };
type View =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "done"; latest: Latest | null; configured: boolean };

/** Owner-only peek at Lana's choice. Needs OWNER_KEY (+ BLOB_READ_WRITE_TOKEN) on the server. */
export default function JulianPage() {
  const [key, setKey] = useState("");
  const [view, setView] = useState<View>({ state: "idle" });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setView({ state: "loading" });
    try {
      const res = await fetch(`/api/choice?key=${encodeURIComponent(key.trim())}`, { cache: "no-store" });
      if (res.status === 401) return setView({ state: "error", message: "That is not the key." });
      if (res.status === 404) return setView({ state: "error", message: "The owner key is not configured on the server." });
      if (!res.ok) return setView({ state: "error", message: "The choice could not be read right now." });
      const json = (await res.json()) as { latest?: Latest | null; configured?: boolean };
      setView({ state: "done", latest: json.latest ?? null, configured: json.configured !== false });
    } catch {
      setView({ state: "error", message: "No connection. Try again in a moment." });
    }
  };

  const latest = view.state === "done" ? view.latest : null;
  const k = latest ? kingdomCopy(latest.choice) : null;

  return (
    <main className="stage">
      <section className="chapter items-center justify-center text-center text-[#F3E7D6]">
        <div className="bg-midnight absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 flex w-full max-w-[20rem] flex-col items-center">
          <p className="label-caps text-gold">For Julian only</p>
          <h1 className="headline mt-4 text-[2.1rem] text-gold-light">Her chosen kingdom</h1>

          <form onSubmit={submit} className="mt-8 flex w-full flex-col gap-3">
            <label htmlFor="owner-key" className="sr-only">
              Owner key
            </label>
            <input
              id="owner-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Owner key"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="velvet h-[52px] w-full rounded-[4px] px-4 text-center text-[#F3E7D6] outline-none placeholder:text-[#F3E7D6]/40"
            />
            <button type="submit" className="btn btn-gold btn-full" disabled={view.state === "loading"}>
              <span className="relative z-[2]">{view.state === "loading" ? "Asking the stars…" : "Reveal"}</span>
            </button>
          </form>

          <div className="mt-8 min-h-[7rem]" aria-live="polite">
            {view.state === "error" && <p className="font-display text-[1.1rem] italic text-[#F3E7D6]/80">{view.message}</p>}
            {view.state === "done" && k && latest && (
              <>
                <p className="headline text-[1.9rem] text-gold-light">{k.name}</p>
                <p className="mt-1 font-display text-[1.1rem] italic text-[#F3E7D6]/85">{k.place}</p>
                <p className="label-caps mt-4 !mr-0 !text-[0.5938rem] text-[#F3E7D6]/55">
                  {latest.at ? new Date(latest.at).toLocaleString() : ""}
                </p>
              </>
            )}
            {view.state === "done" && !k && (
              <p className="font-display text-[1.1rem] italic text-[#F3E7D6]/80">
                {view.configured ? "She has not chosen yet." : "Storage is not configured, so nothing can be delivered here."}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
