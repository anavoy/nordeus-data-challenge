import _ from 'lodash';

import prisma from '../utils/prisma';

import { EventMatch, isValidTimestamp } from './common';

export async function loadMatches(eventsData: EventMatch[]) {
  console.log('== Utakmice ucitavanje.');

  // Provera validnosti podataka
  const rawMatchesEvents: EventMatch[] = eventsData.filter(
    (event: { event_type: string }) => event.event_type === 'match'
  );
  console.log('Utakmice:', rawMatchesEvents.length);

  const validMatchesEvents = [];
  const uniqueUserIds = new Set<string>();

  for (const event of rawMatchesEvents) {
    if (!isValidTimestamp(event.event_timestamp)) {
      console.log('Nevalidan event_timestamp:', event);
      continue;
    }
    if (!event.event_data.match_id) {
      console.log('Nedostaje match_id:', event);
      continue;
    }
    if (!event.event_data.away_user_id) {
      console.log('Nedostaje away_user_id:', event);
      continue;
    }
    if (!event.event_data.home_user_id) {
      console.log('Nedostaje home_user_id:', event);
      continue;
    }
    if (
      !Number.isInteger(event.event_data.away_goals_scored) ||
      event.event_data.away_goals_scored < 0
    ) {
      if (event.event_data.away_goals_scored !== null) {
        console.log('Nedostaje away_goals_scored:', event);
        continue;
      }
    }
    if (
      !Number.isInteger(event.event_data.home_goals_scored) ||
      event.event_data.home_goals_scored < 0
    ) {
      if (event.event_data.home_goals_scored !== null) {
        console.log('Nedostaje home_goals_scored:', event);
        continue;
      }
    }
    uniqueUserIds.add(event.event_data.away_user_id);
    uniqueUserIds.add(event.event_data.home_user_id);

    validMatchesEvents.push(event);
  }

  console.log('Jedinstveni korisnici:', uniqueUserIds.size);
  console.log(
    `${validMatchesEvents.length} validnih utakmica od ukupno: ${rawMatchesEvents.length}`
  );

  const existingUsers = await prisma.user.findMany({
    select: { user_id: true },
    where: {
      user_id: { in: [...uniqueUserIds] }
    }
  });

  const existingUserIdsSet = new Set(existingUsers.map((user) => user.user_id));

  console.log('Jedinstveni koji su u bazi korisnici:', existingUserIdsSet.size);

  const sortedMatchesEvents = validMatchesEvents
    .filter(
      (event) =>
        existingUserIdsSet.has(event.event_data.home_user_id) ||
        existingUserIdsSet.has(event.event_data.away_user_id)
    )
    .sort((a, b) => {
      if (a.event_data.match_id === b.event_data.match_id) {
        return a.event_timestamp - b.event_timestamp;
      }
      return a.event_data.match_id.localeCompare(b.event_data.match_id);
    });

  const matchesData: {
    match_id: string;
    home_user_id: string;
    away_user_id: string;
    home_goals_scored: number;
    away_goals_scored: number;
    start_time: Date;
    end_time: Date;
  }[] = [];

  let j = 0;
  for (let i = 0; i < sortedMatchesEvents.length - 1; i = j) {
    const currentEvent = sortedMatchesEvents[i];
    if (
      !(
        currentEvent.event_data.home_goals_scored === null &&
        currentEvent.event_data.away_goals_scored === null
      )
    ) {
      console.log('Nedostaju nullovi za golove na pocetku:', currentEvent);
      continue;
    }

    let nextEvent: null | EventMatch = null;

    for (j = i + 1; j < sortedMatchesEvents.length; j++) {
      if (currentEvent.event_data.match_id !== sortedMatchesEvents[j].event_data.match_id) {
        break;
      }
      nextEvent = sortedMatchesEvents[j];
    }

    if (!nextEvent) {
      console.log('Nedostaje kraj za utakmicu:', currentEvent);
    } else {
      matchesData.push({
        match_id: currentEvent.event_data.match_id,
        home_user_id: currentEvent.event_data.home_user_id,
        away_user_id: currentEvent.event_data.away_user_id,
        home_goals_scored: nextEvent.event_data.home_goals_scored,
        away_goals_scored: nextEvent.event_data.away_goals_scored,
        start_time: new Date(currentEvent.event_timestamp * 1000),
        end_time: new Date(nextEvent.event_timestamp * 1000)
      });
    }
  }

  console.log('Utakmice pronadjene:', matchesData.length);

  //Moguce je dodati proveri da li vec ovakve sesije postoje u bazi i dodati unique po user_id i start_time
  if (matchesData.length > 0) {
    const chunks = _.chunk(matchesData, 100);

    let insertedMatches = 0;
    try {
      for (const chunk of chunks) {
        // Sa obzirom da SQLite ne podrzava createMany sa skipDuplicates
        // Koristicemo create i Promise.allSettled i time duplikati ce biti ignorisani
        const results = await Promise.allSettled(
          chunk.map(async (session) =>
            prisma.match.create({
              data: session
            })
          )
        );

        const success = results.filter((result) => result.status === 'fulfilled');
        insertedMatches += success.length;
      }
    } catch (e) {
      console.error('Greška pri unosu utakmica:', e);
    }

    console.log(`Utakmice (${insertedMatches}/${matchesData.length}) uspešno učitani.`);
  } else {
    console.log('Nema novih utakmica za unos.');
  }
  console.log('=> Utakmice uspešno učitani.');
}
