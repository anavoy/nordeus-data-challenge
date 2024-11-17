import prisma from '../utils/prisma';

import { EventRegistration, isValidTimestamp } from './common';

export async function loadUsers(eventsData: EventRegistration[]) {
  console.log('== Korisnici ucitavanje.');

  // Provera validnosti podataka
  const validOSValues = ['iOS', 'Android', 'Web'];
  const validUUIDRegex =
    /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
  let possibleBadUUIDs = 0;
  const uniqueUserIds = new Set<string>();

  const validRegisterEvents: EventRegistration[] = [];
  const rawRegisterEvents = eventsData.filter((event) => event.event_type === 'registration');

  for (const event of rawRegisterEvents) {
    if (!isValidTimestamp(event.event_timestamp)) {
      console.log('Nevalidan event_timestamp:', event);
    }
    if (!event.event_data.user_id) {
      console.log('Nedostaje user_id:', event);
      continue;
    }
    if (!event.event_data.country) {
      console.log('Nedostaje country:', event);
      continue;
    }
    if (!event.event_data.device_os) {
      console.log('Nedostaje device_os:', event);
      continue;
    }
    if (!validOSValues.includes(event.event_data.device_os)) {
      console.log('Nepoznat device_os:', event);
      continue;
    }
    if (event.event_data.country.length !== 2) {
      console.log('Los country:', event);
      continue;
    }
    if (!validUUIDRegex.test(event.event_data.user_id)) {
      possibleBadUUIDs++;
      // continue;
    }
    if (uniqueUserIds.has(event.event_data.user_id)) {
      console.log('Duplikat user_id:', event);
      continue;
    }
    uniqueUserIds.add(event.event_data.user_id);
    validRegisterEvents.push(event);
  }

  console.log(
    `${validRegisterEvents.length} validnih registracija od ukupno ${rawRegisterEvents.length}`
  );

  if (possibleBadUUIDs > 0) {
    console.log('Moguci losi UUID:', possibleBadUUIDs);
  }

  // Mogli bi da koristimo samo createMany sa skipDuplicates
  // ali to nije moguce sa sqlite-om, pa moramo da proverimo sta vec postoji u bazi
  // Nije najbolja opcija ako je velika baza, ali tada bi se koristio skipDuplicates
  const existingUsers = await prisma.user.findMany({
    select: { user_id: true }
  });
  const existingUserIdsSet = new Set(existingUsers.map((user) => user.user_id));

  const newUsersData = validRegisterEvents
    .filter((event) => !existingUserIdsSet.has(event.event_data.user_id)) // preskače duplikate iz baze
    .map((event) => ({
      user_id: event.event_data.user_id,
      country: event.event_data.country,
      device_os: event.event_data.device_os,
      registration_time: new Date(event.event_timestamp * 1000)
    }));

  if (newUsersData.length > 0) {
    await prisma.user.createMany({
      data: newUsersData
    });
    console.log(`Korisnici (${newUsersData.length}) uspešno učitani.`);
  } else {
    console.log('Nema novih korisnika za unos.');
  }
  console.log('=> Korisnici uspešno učitani.');
}
