import { notFound } from "next/navigation";

import { RacePaceDashboard } from "@/components/RacePaceDashboard";
import { getPitStopsByEvent, getStintSummariesByEvent, getTyreUsageByEvent } from "@/lib/laps";
import { EVENT_OPTIONS, getEventById, getFinalClassificationByEvent, getLapTracesByEvent, getQualifyingRaceComparisonByEvent, getRacePaceByEvent, getRaceSummaryByEvent } from "@/lib/static-data";
import { getStrategyTimelineByEvent } from "@/lib/strategy";

type Props = {
  params: Promise<{
    eventId: string;
  }>;
};

export function generateStaticParams() {
  return EVENT_OPTIONS.map((event) => ({ eventId: event.id }));
}

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params;
  const event = getEventById(eventId);
  if (!event) return { title: "Event not found · GridIQ" };

  return {
    title: `${event.shortLabel} race pace · GridIQ`,
    description: event.description,
  };
}

export default async function EventRacePacePage({ params }: Props) {
  const { eventId } = await params;
  const event = getEventById(eventId);
  if (!event) notFound();

  const pace = getRacePaceByEvent(event.id);
  const summary = getRaceSummaryByEvent(event.id);
  const stints = getStintSummariesByEvent(event.id);
  const lapTraces = getLapTracesByEvent(event.id);
  const pitStops = getPitStopsByEvent(event.id);
  const tyreUsage = getTyreUsageByEvent(event.id);
  const qualifyingComparison = getQualifyingRaceComparisonByEvent(event.id);
  const strategies = getStrategyTimelineByEvent(event.id);
  const finalClassification = getFinalClassificationByEvent(event.id);

  return (
    <RacePaceDashboard
      event={event}
      pace={pace}
      summary={summary}
      events={EVENT_OPTIONS}
      stints={stints}
      lapTraces={lapTraces}
      pitStops={pitStops}
      tyreUsage={tyreUsage}
      qualifyingComparison={qualifyingComparison}
      strategies={strategies}
      finalClassification={finalClassification}
    />
  );
}
