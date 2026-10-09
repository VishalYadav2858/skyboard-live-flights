export type Status = "On Time" | "Boarding" | "Delayed" | "Departed" | "Landed" | "Cancelled" | "Approaching";
export interface Flight {
  id: string;
  code: string;
  airline: string;
  city: string;
  time: Date;
  gate: string;
  status: Status;
  type: "arr" | "dep";
  delay: number;
}

const AIRLINES: [string, string][] = [["AI", "Air India"], ["6E", "IndiGo"], ["EK", "Emirates"], ["BA", "British Airways"], ["SQ", "Singapore Airlines"], ["LH", "Lufthansa"], ["QR", "Qatar Airways"], ["UK", "Vistara"]];
const CITIES = ["London", "Dubai", "Singapore", "Mumbai", "Bengaluru", "Frankfurt", "Doha", "New York", "Tokyo", "Paris", "Chennai", "Kolkata", "Sydney", "Hong Kong"];
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)] as T;

export function makeFlight(type: "arr" | "dep", offsetMin: number): Flight {
  const [c, airline] = pick(AIRLINES);
  const time = new Date(Date.now() + offsetMin * 60000);
  time.setSeconds(0, 0);
  return {
    id: Math.random().toString(36).slice(2),
    code: `${c} ${100 + Math.floor(Math.random() * 899)}`,
    airline, city: pick(CITIES), time, type,
    gate: `${pick(["A", "B", "C", "D"])}${1 + Math.floor(Math.random() * 30)}`,
    status: "On Time", delay: 0,
  };
}

export function statusFor(f: Flight, now: number): Status {
  if (f.status === "Cancelled") return "Cancelled";
  const mins = (f.time.getTime() + f.delay * 60000 - now) / 60000;
  if (f.type === "dep") {
    if (mins < 0) return "Departed";
    if (mins < 30) return "Boarding";
  } else {
    if (mins < 0) return "Landed";
    if (mins < 20) return "Approaching";
  }
  return f.delay > 0 ? "Delayed" : "On Time";
}

export function initialFlights(): Flight[] {
  const out: Flight[] = [];
  for (let i = 0; i < 14; i++) {
    out.push(makeFlight("dep", -20 + i * 12), makeFlight("arr", -25 + i * 11));
  }
  return out;
}

/** Randomly perturb flights: delays and rare cancellations. */
export function tick(flights: Flight[]): Flight[] {
  return flights.map((f) => {
    const r = Math.random();
    if (r < 0.03 && f.status !== "Cancelled") return { ...f, delay: f.delay + 5 + Math.floor(Math.random() * 20) };
    if (r > 0.997) return { ...f, status: "Cancelled" };
    return f;
  });
}
