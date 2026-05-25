"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ComparePickerProps = {
  drivers: string[];
  defaultDriverA: string;
  defaultDriverB: string;
};

export function ComparePicker({ drivers, defaultDriverA, defaultDriverB }: ComparePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverA = searchParams.get("driverA")?.toUpperCase() ?? defaultDriverA;
  const driverB = searchParams.get("driverB")?.toUpperCase() ?? defaultDriverB;

  function updateParam(key: "driverA" | "driverB", value: string) {
    const nextDriverA = key === "driverA" ? value : driverA;
    const nextDriverB = key === "driverB" ? value : driverB;

    if (nextDriverA.toUpperCase() === nextDriverB.toUpperCase()) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value.toLowerCase());
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div className="comparePicker">
      <label>
        <span className="label">Driver A</span>
        <select value={driverA} onChange={(event) => updateParam("driverA", event.target.value)}>
          {drivers.map((driver) => (
            <option key={driver} value={driver} disabled={driver === driverB}>
              {driver}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Driver B</span>
        <select value={driverB} onChange={(event) => updateParam("driverB", event.target.value)}>
          {drivers.map((driver) => (
            <option key={driver} value={driver} disabled={driver === driverA}>
              {driver}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
