export function formatLap(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds - minutes * 60).toFixed(3).padStart(6, "0");
  return `${minutes}:${rest}`;
}

export function formatGap(seconds: number): string {
  return seconds === 0 ? "+0.000" : `+${seconds.toFixed(3)}`;
}
