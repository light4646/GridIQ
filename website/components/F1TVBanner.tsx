import Link from "next/link";
import { F1TV } from "@/lib/monetization";

type Variant = "compact" | "full";

/**
 * F1 TV affiliate call-to-action.
 *
 * compact — one-line pill, suitable for inside panels or next to content.
 * full    — banner card, suitable between page sections.
 *
 * Replace F1TV.affiliateUrl in lib/monetization.ts with your Impact
 * affiliate link once you are approved as an F1 TV partner.
 */
export default function F1TVBanner({ variant = "full" }: { variant?: Variant }) {
  if (variant === "compact") {
    return (
      <a
        href={F1TV.affiliateUrl}
        target="_blank"
        rel="noopener sponsored"
        className="f1tvCompact"
        aria-label="Watch F1 live on F1 TV"
      >
        <span className="f1tvFlag">🏁</span>
        <span>Watch F1 live · F1 TV from {F1TV.monthlyPrice}/mo</span>
        <span className="f1tvArrow">→</span>
      </a>
    );
  }

  return (
    <aside className="f1tvBanner" aria-label="F1 TV promotion">
      <div className="f1tvBannerInner">
        <div className="f1tvBannerText">
          <div className="f1tvBannerEyebrow">Watch every race live</div>
          <h3 className="f1tvBannerTitle">F1 TV — the official Formula 1 streaming service</h3>
          <p className="f1tvBannerBody">
            Every race, qualifying session, and Sprint live and on demand. Onboard cameras,
            team radio, driver tracker, and multi-channel audio — from {F1TV.annualPrice}/year.
          </p>
        </div>
        <div className="f1tvBannerActions">
          <a
            href={F1TV.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            className="f1tvBannerCta"
          >
            Try F1 TV Pro →
          </a>
          <p className="f1tvBannerNote">Official F1 streaming · cancel anytime</p>
        </div>
      </div>
    </aside>
  );
}
