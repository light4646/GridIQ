import { formatLap } from "@/lib/f1-utils";
import type { DriverStrategy } from "@/lib/types";

type Props = {
  strategies: DriverStrategy[];
};

function compoundClass(compound: string): string {
  return `compound compound-${compound.toLowerCase()}`;
}

export function StrategyTimeline({ strategies }: Props) {
  return (
    <section className="panel widePanel strategyPanel">
      <div className="panelHeader">
        <div>
          <h2>Strategy timeline</h2>
          <p>v0.9 race story: tyre stints, stop windows, and pace rank in one readable view.</p>
        </div>
        <span className="pill miniPill">Race story</span>
      </div>

      <div className="strategyList">
        {strategies.map((strategy) => (
          <article className="strategyRow" key={`${strategy.driver}-strategy`}>
            <div className="strategyDriver">
              <strong>{strategy.driver}</strong>
              <span>{strategy.team}</span>
              <small>P{strategy.racePaceRank} race pace</small>
            </div>

            <div className="strategyBody">
              <div className="strategyTrack" aria-label={`${strategy.driver} strategy timeline`}>
                {strategy.stints.map((stint) => (
                  <div
                    className={`strategyStint strategy-${stint.compound.toLowerCase()}`}
                    key={`${strategy.driver}-stint-${stint.stint}`}
                    style={{ width: `${stint.widthPercent}%` }}
                    title={`Stint ${stint.stint}: laps ${stint.fromLap}-${stint.toLap}, avg ${formatLap(stint.averageLapSeconds)}`}
                  >
                    <span>{stint.compound}</span>
                    <small>L{stint.fromLap}-{stint.toLap}</small>
                  </div>
                ))}
              </div>

              <div className="strategyMeta">
                <span>{strategy.summary}</span>
                <div className="stopChips">
                  {strategy.pitStops.length === 0 ? (
                    <span className="stopChip">No detected stops</span>
                  ) : strategy.pitStops.map((stop) => (
                    <span className="stopChip" key={`${strategy.driver}-stop-${stop.stopNumber}`}>
                      Stop {stop.stopNumber}: L{stop.pitInLap}→L{stop.pitOutLap} · <span className={compoundClass(stop.fromCompound)}>{stop.fromCompound}</span> to <span className={compoundClass(stop.toCompound)}>{stop.toCompound}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
