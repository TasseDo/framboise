import React, { useEffect, useMemo, useState } from "react";

const API_URL = (() => {
  const latitude = 45.650002;
  const longitude = -74.083336;
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m",
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    timezone: "auto",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
})();

export default function OpenMeteoWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(API_URL)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const { currentTemp, todayMax, todayMin, todayCode, locationLabel } = useMemo(() => {
    if (!data)
      return {
        currentTemp: null,
        todayMax: null,
        todayMin: null,
        todayCode: null,
        locationLabel: "",
      };

    const currentTemp = data?.current?.temperature_2m ?? null;

    const idx = 0;
    const todayMax = data?.daily?.temperature_2m_max?.[idx] ?? null;
    const todayMin = data?.daily?.temperature_2m_min?.[idx] ?? null;
    const todayCode = data?.daily?.weather_code?.[idx] ?? null;

    const lat = Number(data?.latitude).toFixed(3);
    const lon = Number(data?.longitude).toFixed(3);
    const tz = data?.timezone ?? "";

    return {
      currentTemp,
      todayMax,
      todayMin,
      todayCode,
      locationLabel: `Lat ${lat}, Lon ${lon} • ${tz}`,
    };
  }, [data]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white/70 backdrop-blur-md">
          <Header />

          <div className="p-6 grid gap-6">
            {loading && <Skeleton />}
            {!loading && error && <ErrorCard error={error} />}

            {!loading && !error && (
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="text-slate-800 font-medium">{locationLabel}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-900 text-white">Open-Meteo</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <Stat label="Current" value={fmtTemp(currentTemp)} big />
                  <Stat label="Max (Today)" value={fmtTemp(todayMax)} />
                  <Stat label="Min (Today)" value={fmtTemp(todayMin)} />
                  <Stat label="Weather" value={weatherCodeToEmoji(todayCode)} />
                </div>
              </div>
            )}
          </div>
        </div>
        <FooterNote />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-200/70 bg-gradient-to-r from-indigo-600/10 to-sky-500/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600/90 text-white grid place-content-center shadow">
            <span className="text-lg font-bold">°C</span>
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-semibold text-slate-900">Weather</h1>
            <p className="text-slate-600 text-sm">Current, today’s max & min</p>
          </div>
        </div>
        <Refresh onClick={() => window.location.reload()} small />
      </div>
    </div>
  );
}

function Stat({ label, value, big = false }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white/70 p-4 text-center shadow-sm ${big ? "row-span-1" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-semibold text-slate-900 ${big ? "text-3xl" : "text-2xl"}`}>{value ?? "—"}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse grid gap-4">
      <div className="h-5 w-48 bg-slate-200 rounded" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 bg-slate-200 rounded-xl" />
        <div className="h-20 bg-slate-200 rounded-xl" />
        <div className="h-20 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

function ErrorCard({ error }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
      <p className="font-medium">Couldn’t load weather</p>
      <p className="text-sm mt-1">{String(error?.message || error)}</p>
      <p className="text-xs mt-2 text-rose-600">Check your connection and try again.</p>
    </div>
  );
}

function Refresh({ onClick, small = false }) {
  return (
    <button
      onClick={onClick}
      className={`${small ? "p-2" : "w-full mt-2 px-4 py-3 text-sm font-medium"} inline-flex items-center justify-center rounded-xl bg-slate-900 text-white shadow hover:shadow-md active:scale-[0.99]`}
      title="Reload data"
    >
      <svg
        width={small ? "20" : "18"}
        height={small ? "20" : "18"}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function FooterNote() {
  return (
    <p className="text-center text-xs text-slate-500 mt-4">
      Data source: <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
    </p>
  );
}

function fmtTemp(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const rounded = Math.round(n);
  return `${rounded}°C`;
}

function weatherCodeToEmoji(code) {
  if (code === null || code === undefined) return "—";

  const rainyCodes = [
    51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
  ];
  if (rainyCodes.includes(code)) return "🌧️";
  if (code === 0) return "☀️";
  return "☁️";
}
