"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatLap } from "@/lib/f1-utils";
import type { DriverLapTrace, EventOption } from "@/lib/types";

type Props = {
  activeEvent: EventOption;
  events: EventOption[];
  lapTraces: DriverLapTrace[];
};

function routeForEvent(eventId: string): string {
  return eventId === "2024-monza-race" ? "/" : `/events/${eventId}`;
}

function makePolyline(laps: { lap: number; seconds: number }[], width: number, height: number): string {
  if (laps.length === 0) return "";
  const lapNumbers = laps.map((lap) => lap.lap);
  const seconds = laps.map((lap) => lap.seconds);
  const minLap = Math.min(...lapNumbers);
  const maxLap = Math.max(...lapNumbers);
  const minSecond = Math.min(...seconds);
  const maxSecond = Math.max(...seconds);
  const lapRange = Math.max(maxLap - minLap, 1);
  const secondRange = Math.max(maxSecond - minSecond, 0.001);

  return laps
    .map((lap) => {
      const x = ((lap.lap - minLap) / lapRange) * width;
      const y = height - ((lap.seconds - minSecond) / secondRange) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function EventExplorer({ activeEvent, events, lapTraces }: Props) {
  const router = useRouter();
  const [selectedDriver, setSelectedDriver] = useState(lapTraces[0]?.driver ?? "");

  useEffect(() => {
    setSelectedDriver(lapTraces[0]?.driver ?? "");
  }, [activeEvent.id, lapTraces]);

  const selectedTrace = useMemo(() => {
    return lapTraces.find((trace) => trace.driver === selectedDriver) ?? lapTraces[0] ?? null;
  }, [lapTraces, selectedDriver]);

  const selectedLaps = selectedTrace?.laps ?? [];
  const averageLap = selectedLaps.reduce((sum, lap) => sum + lap.seconds, 0) / Math.max(selectedLaps.length, 1);
  const bestLap = selectedLaps.length > 0 ? Math.min(...selectedLaps.map((lap) => lap.seconds)) : 0;
  const polyline = makePolyline(selectedLaps, 520, 180);

  return (
    <section className="panel widePanel eventExplorer">
      <div className="panelHeader">
        <div>
          <h2>Event explorer</h2>
          <p>v0.8 control room: switch race weekends and inspect a driver lap trace without leaving the dashboard.</p>
        </div>
        <span className="pill miniPill">Interactive</span>
      </div>

      <div className="explorerGrid">
        <label className="fieldLabel">
          Race weekend
          <select
            className="selectInput"
            value={activeEvent.id}
            onChange={(event) => router.push(routeForEvent(event.target.value))}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.shortLabel} · {event.session}</option>
            ))}
          </select>
        </label>

        <label className="fieldLabel">
          Driver lap trace
          <select
            className="selectInput"
            value={selectedTrace?.driver ?? ""}
            onChange={(event) => setSelectedDriver(event.target.value)}
            disabled={lapTraces.length === 0}
          >
            {lapTraces.length === 0 ? (
              <option value="">No lap traces loaded</option>
            ) : (
              lapTraces.map((trace) => (
                <option key={`${activeEvent.id}-${trace.driver}`} value={trace.driver}>{trace.driver} · {trace.team}</option>
              ))
            )}
          </select>
        </label>

        <div className="explorerStats">
          <div><span>Driver</span><strong>{selectedTrace?.driver ?? "—"}</strong></div>
          <div><span>Laps</span><strong>{selectedLaps.length}</strong></div>
          <div><span>Avg</span><strong>{averageLap > 0 ? formatLap(averageLap) : "—"}</strong></div>
          <div><span>Best</span><strong>{bestLap > 0 ? formatLap(bestLap) : "—"}</strong></div>
        </div>
      </div>

      <div className="lapChart" aria-label={`${selectedTrace?.driver ?? "Driver"} lap time chart`}>
        <svg viewBox="0 0 560 220" role="img">
          <line x1="24" y1="190" x2="544" y2="190" className="chartAxis" />
          <line x1="24" y1="10" x2="24" y2="190" className="chartAxis" />
          {selectedLaps.length > 0 ? (
            <>
              <polyline points={polyline} transform="translate(24 10)" className="lapPolyline" />
              {selectedLaps.filter((_, index) => index % 5 === 0).map((lap) => {
                const lapNumbers = selectedLaps.map((point) => point.lap);
                const seconds = selectedLaps.map((point) => point.seconds);
                const x = ((lap.lap - Math.min(...lapNumbers)) / Math.max(Math.max(...lapNumbers) - Math.min(...lapNumbers), 1)) * 520 + 24;
                const y = 190 - ((lap.seconds - Math.min(...seconds)) / Math.max(Math.max(...seconds) - Math.min(...seconds), 0.001)) * 180;
                return <circle key={`${selectedTrace?.driver}-${lap.lap}`} cx={x} cy={y} r="3" className={`chartDot compound-${lap.compound.toLowerCase()}`} />;
              })}
            </>
          ) : (
            <text x="280" y="112" textAnchor="middle" className="chartEmptyText">
              No lap trace data loaded for this race yet
            </text>
          )}
        </svg>
        <div className="lapChartHint">Lower is faster. Dots are every fifth clean lap, colored by tyre compound.</div>
      </div>
    </section>
  );
}
