'use client';

import { formatLocalDatetime, guessTimezoneFromDestination } from '@travel/shared';

interface Props {
  utcIso: string;
  destination?: string;
  timezone?: string;
}

export default function LocalDatetime({ utcIso, destination, timezone }: Props) {
  const tz = timezone ?? (destination ? guessTimezoneFromDestination(destination) : 'UTC');
  return <span title={`UTC: ${utcIso}`}>{formatLocalDatetime(utcIso, tz)}</span>;
}
