import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plane, PlaneLanding, PlaneTakeoff, Search } from "lucide-react";
import { initialFlights, makeFlight, statusFor, tick, type Flight, type Status } from "@/lib/flights";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkyBoard — Live Arrivals & Departures" },
      { name: "description", content: "Live airport dashboard tracking arrivals, departures, gates and delays in real time." },
      { property: "og:title", content: "SkyBoard — Live Arrivals & Departures" },
      { property: "og:description", content: "Live airport dashboard tracking arrivals, departures, gates and delays." },
    ],
  }),
  component: Index,
});

const STATUS_CLASS: Record<Status, string> = {
  "On Time": "text-accent",
  Boarding: "text-primary animate-pulse",
  Approaching: "text-info animate-pulse",
  Delayed: "text-warning",
  Departed: "text-muted-foreground",
  Landed: "text-muted-foreground",
  Cancelled: "text-destructive",
};

const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

function Index() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [now, setNow] = useState(0);
  const [tab, setTab] = useState<"dep" | "arr">("dep");
  const [q, setQ] = useState("");

  useEffect(() => {
    setFlights(initialFlights());
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
      setFlights((fs) => {
        let next = tick(fs).filter((f) => f.time.getTime() + f.delay * 60000 > Date.now() - 45 * 60000);
        for (const t of ["dep", "arr"] as const) {
          if (next.filter((f) => f.type === t).length < 14) next = [...next, makeFlight(t, 150 + Math.random() * 30)];
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const withStatus = useMemo(() => flights.map((f) => ({ ...f, live: statusFor(f, now) })), [flights, now]);
  const rows = withStatus
    .filter((f) => f.type === tab)
    .filter((f) => !q || `${f.code} ${f.city} ${f.airline}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  const count = (s: Status[]) => withStatus.filter((f) => s.includes(f.live)).length;
  const stats = [
    { label: "Departures", value: withStatus.filter((f) => f.type === "dep").length, cls: "text-primary" },
    { label: "Arrivals", value: withStatus.filter((f) => f.type === "arr").length, cls: "text-info" },
    { label: "Delayed", value: count(["Delayed"]), cls: "text-warning" },
    { label: "Cancelled", value: count(["Cancelled"]), cls: "text-destructive" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 font-sans">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Plane className="h-9 w-9 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SkyBoard</h1>
            <p className="text-sm text-muted-foreground">International Terminal · Live flight information</p>
          </div>
        </div>
        <div className="text-right font-mono">
          <div className="text-4xl font-semibold text-primary tabular-nums">{now ? new Date(now).toLocaleTimeString([], { hour12: false }) : "--:--:--"}</div>
          <div className="flex items-center justify-end gap-2 text-xs text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> LIVE
          </div>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className={`mt-1 font-mono text-3xl font-semibold ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-border bg-card p-1">
          {([["dep", "Departures", PlaneTakeoff], ["arr", "Arrivals", PlaneLanding]] as const).map(([k, l, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Flight, city, airline"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-secondary text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Time</th><th className="px-4 py-3">Flight</th>
              <th className="px-4 py-3">{tab === "dep" ? "Destination" : "Origin"}</th>
              <th className="px-4 py-3">Gate</th><th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="board-row">
                <td className="px-4 py-3">
                  <span className={f.delay ? "text-muted-foreground line-through" : "text-foreground"}>{fmt(f.time)}</span>
                  {f.delay > 0 && <span className="ml-2 text-warning">{fmt(new Date(f.time.getTime() + f.delay * 60000))}</span>}
                </td>
                <td className="px-4 py-3"><span className="text-primary">{f.code}</span><div className="font-sans text-xs text-muted-foreground">{f.airline}</div></td>
                <td className="px-4 py-3 uppercase">{f.city}</td>
                <td className="px-4 py-3"><span className="flap">{f.gate}</span></td>
                <td className={`px-4 py-3 font-semibold uppercase ${STATUS_CLASS[f.live]}`}>
                  <span key={f.live} className="inline-block" style={{ animation: "flap .5s ease-out" }}>{f.live}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">{flights.length ? "No flights match your search." : "Loading flight board…"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Flight data is simulated and refreshes every 3 seconds.</p>
    </main>
  );
}
