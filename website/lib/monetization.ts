/**
 * GridIQ Monetization Config
 * ─────────────────────────
 * Fill in your affiliate/partner IDs here to enable revenue tracking.
 *
 * AdSense:   https://adsense.google.com → Ad units → create new unit → copy slot ID
 * F1 TV:     https://app.impact.com → search "Formula 1 F1 TV" → apply
 * Amazon:    https://affiliate-program.amazon.com → get your Associates tag
 * Ko-fi:     https://ko-fi.com → your username
 */

export const ADSENSE = {
  /** Your Google AdSense publisher ID — already in <head> script */
  publisherId: "ca-pub-1074761349548277",

  /**
   * Ad slot IDs — create units in AdSense console → Ad units → New ad unit
   * Set format: "Responsive display ad" for each.
   * Leave as "" until you create the unit; the component will not render
   * an empty slot (Auto Ads in <head> still runs in the background).
   */
  slots: {
    /** Homepage / season index — top of page after hero */
    heroLeaderboard: "",
    /** Mid-article — used inside long data tables */
    inContent: "",
    /** Bottom of page before footer */
    bottomBanner: "",
    /** Race analytics pages — sidebar equivalent */
    raceSidebar: "",
  },
} as const;

/** F1 TV affiliate / referral links */
export const F1TV = {
  /**
   * Replace with your Impact affiliate link once approved.
   * Apply at: https://app.impact.com → Marketplace → search "Formula 1"
   * Until then this is the public F1 TV link — still drives subscriptions
   * even without commission tracking.
   */
  affiliateUrl: "https://f1tv.formula1.com/?utm_source=gridiq&utm_medium=referral&utm_campaign=watch",
  monthlyPrice: "$9.99",
  annualPrice: "$79.99",
} as const;

/** Amazon Associates affiliate tag */
export const AMAZON = {
  /**
   * Sign up at https://affiliate-program.amazon.com
   * Then replace "gridiq-20" with your actual Associates tag.
   */
  tag: "gridiq-20",

  /** Pre-built search links (tag appended at runtime) */
  searches: {
    f1Gear: "https://www.amazon.com/s?k=formula+1+merchandise",
    f1Books: "https://www.amazon.com/s?k=formula+1+books",
    f1Helmets: "https://www.amazon.com/s?k=f1+replica+helmet",
    f1Game: "https://www.amazon.com/s?k=f1+2024+game+ps5+xbox",
  },
} as const;

/** Returns an Amazon URL with the Associates tag appended */
export function amazonUrl(base: string): string {
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}tag=${AMAZON.tag}`;
}
