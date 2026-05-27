"use client";

import { useEffect } from "react";
import { ADSENSE } from "@/lib/monetization";

type Props = {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
};

/**
 * Renders an AdSense responsive display ad unit.
 *
 * Usage:
 *   import { ADSENSE } from "@/lib/monetization";
 *   <AdUnit slot={ADSENSE.slots.inContent} />
 *
 * The component renders nothing if:
 *   - slot is empty (get your slot IDs from the AdSense console)
 *   - running in development (ads don't load on localhost)
 */
export default function AdUnit({ slot, format = "auto", className }: Props) {
  useEffect(() => {
    if (!slot) return;
    try {
      const w = window as typeof window & { adsbygoogle: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // Silently ignore in environments where adsbygoogle isn't available
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <div className={`adUnit ${className ?? ""}`} aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE.publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
