import path from 'path';

import { loadMatches } from './loaders/loadMatches';
import { loadSessions } from './loaders/loadSessions';
import { loadTimezones } from './loaders/loadTimezones';
import { loadUsers } from './loaders/loadUsers';
import { loadJsonlData } from './utils/jsonl.util';
import prisma from './utils/prisma';

async function loadDataToDatabase() {
  try {
    console.error('Pocetak brisanja');

    await prisma.session.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Greka pri brisanju podataka:', error);
  } finally {
    console.error('Brisanje gotovo');
    await prisma.$disconnect();
  }
}

loadDataToDatabase().then(() => console.log('Podaci uspešno učitani!'));
