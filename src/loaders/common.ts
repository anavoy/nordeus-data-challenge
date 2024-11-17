export type EventRegistration = {
  event_timestamp: number;
  event_type: string;
  event_data: { user_id: string; country: string; device_os: string };
};

export type EventSessionPing = {
  event_timestamp: number;
  event_type: string;
  event_data: { user_id: string };
};

export type EventMatch = {
  event_timestamp: number;
  event_type: string;
  event_data: {
    match_id: string;
    home_user_id: string;
    away_user_id: string;
    home_goals_scored: number;
    away_goals_scored: number;
  };
};

export function isValidTimestamp(event_timestamp: number): boolean {
  if (!event_timestamp) {
    return false;
  }

  const eventTimestampDate = new Date(event_timestamp * 1000);

  if (isNaN(eventTimestampDate.getTime()) || eventTimestampDate.getTime() > Date.now()) {
    return false;
  }
  return true;
}
