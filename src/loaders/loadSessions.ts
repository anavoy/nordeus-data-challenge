import _ from 'lodash';

import prisma from '../utils/prisma';

import { EventSessionPing, isValidTimestamp } from './common';

export async function loadSessions(eventsData: EventSessionPing[]) {
  console.log('== Sesije ucitavanje.');

  // Provera validnosti podataka
  const rawSessionsEvents: EventSessionPing[] = eventsData.filter(
    (event) => event.event_type === 'session_ping'
  );
  console.log('Sesije:', rawSessionsEvents.length);

  const validSessionEvents = [];
  const uniqueUserIds = new Set<string>();

  for (const event of rawSessionsEvents) {
    if (!isValidTimestamp(event.event_timestamp)) {
      console.log('Nevalidan event_timestamp:', event);
      continue;
    }
    if (!event.event_data.user_id) {
      console.log('Nedostaje user_id:', event);
      continue;
    }
    uniqueUserIds.add(event.event_data.user_id);
    validSessionEvents.push(event);
  }

  console.log('Jedinstveni korisnici:', uniqueUserIds.size);
  console.log(
    `${validSessionEvents.length} validnih sesija od ukupno: ${rawSessionsEvents.length}`
  );

  const existingUsers = await prisma.user.findMany({
    select: { user_id: true },
    where: {
      user_id: { in: [...uniqueUserIds] }
    }
  });

  const existingUserIdsSet = new Set(existingUsers.map((user) => user.user_id));

  console.log('Jedinstveni koji su u bazi korisnici:', existingUserIdsSet.size);

  const sortedSessionEvents = validSessionEvents
    .filter((event) => existingUserIdsSet.has(event.event_data.user_id))
    .sort((a, b) => {
      if (a.event_data.user_id === b.event_data.user_id) {
        return a.event_timestamp - b.event_timestamp;
      }
      return a.event_data.user_id.localeCompare(b.event_data.user_id);
    });

  const sessionsData: {
    user_id: string;
    start_time: Date;
    end_time: Date;
  }[] = [];

  let j = 0;
  for (let i = 0; i < sortedSessionEvents.length - 1; i = j) {
    const currentEvent = sortedSessionEvents[i];
    let nextEvent: null | EventSessionPing = null;

    for (j = i + 1; j < sortedSessionEvents.length; j++) {
      if (currentEvent.event_data.user_id !== sortedSessionEvents[j].event_data.user_id) {
        break;
      }
      const lastEvent = nextEvent || currentEvent;
      if (sortedSessionEvents[j].event_timestamp - lastEvent.event_timestamp > 60) {
        break;
      }
      nextEvent = sortedSessionEvents[j];
    }

    if (!nextEvent) {
      // Ako je korisnik imao samo pocetni event, smatracemo da je igrao samo 60 sekundi
      sessionsData.push({
        user_id: currentEvent.event_data.user_id,
        start_time: new Date(currentEvent.event_timestamp * 1000),
        end_time: new Date((currentEvent.event_timestamp + 60) * 1000)
      });
    } else {
      sessionsData.push({
        user_id: currentEvent.event_data.user_id,
        start_time: new Date(currentEvent.event_timestamp * 1000),
        end_time: new Date((nextEvent.event_timestamp + 60) * 1000)
      });
    }
  }

  console.log('Sesije pronadjene:', sessionsData.length);

  //Moguce je dodati proveri da li vec ovakve sesije postoje u bazi i dodati unique po user_id i start_time
  if (sessionsData.length > 0) {
    const chunks = _.chunk(sessionsData, 100);

    let insertedSessions = 0;
    try {
      for (const chunk of chunks) {
        // Sa obzirom da SQLite ne podrzava createMany sa skipDuplicates
        // Koristicemo create i Promise.allSettled i time duplikati ce biti ignorisani
        const results = await Promise.allSettled(
          chunk.map(async (session) =>
            prisma.session.create({
              data: session
            })
          )
        );

        const success = results.filter((result) => result.status === 'fulfilled');
        insertedSessions += success.length;
      }
    } catch (e) {
      console.error('Greška pri unosu sesija:', e);
    }

    console.log(`Sesije (${insertedSessions}/${sessionsData.length}) uspešno učitani.`);
  } else {
    console.log('Nema novih sesija za unos.');
  }
  console.log('=> Sesije uspešno učitani.');
}
