import path from 'path';

import { loadMatches } from './loaders/loadMatches';
import { loadSessions } from './loaders/loadSessions';
import { loadTimezones } from './loaders/loadTimezones';
import { loadUsers } from './loaders/loadUsers';
import { loadJsonlData } from './utils/jsonl.util';
import prisma from './utils/prisma';

async function loadDataToDatabase() {
  try {
    const eventsData = loadJsonlData(path.resolve(__dirname, './data/events.jsonl'));
    const timezonesData = loadJsonlData(path.resolve(__dirname, './data/timezones.jsonl'));

    console.log('eventsData', eventsData.length);
    console.log('timezonesData', timezonesData.length);

    console.error('Pocetak unosa');

    await loadTimezones(timezonesData);
    await loadUsers(eventsData);
    await loadSessions(eventsData);
    await loadMatches(eventsData);
  } catch (error) {
    console.error('Greka pri unosu podataka:', error);
  } finally {
    console.error('Gotov unos');
    await prisma.$disconnect();
  }
}

loadDataToDatabase().then(() => console.log('Podaci uspešno učitani!'));
