import prisma from './utils/prisma';
import { loadJsonlData } from './utils/loadData.util';

// Učitaj podatke iz JSONL fajlova
const eventsData = loadJsonlData('./data/events.jsonl'); // ispravna putanja
const timezonesData = loadJsonlData('./data/timezones.jsonl'); // ispravna putanja

async function loadDataToDatabase() {
    try {
        for (const event of eventsData) {
            // Procesuiraj i unesi podatke u odgovarajuće tabele
            if (event.event_type === 'registration') {
                await prisma.user.create({
                    data: {
                        user_id: event.user_id, // Uveri se da ovo postoji u JSONL
                        country: event.country,
                        device_os: event.device_os,
                        registration_date: new Date(event.event_timestamp * 1000),
                    },
                });
            }
            // Dodaj logiku za ostale tipove događaja (session_ping, match)
        }

        for (const timezone of timezonesData) {
            await prisma.timezone.create({
                data: {
                    country: timezone.country,
                    timezone: timezone.timezone,
                },
            });
        }

        console.log('Podaci uspešno učitani u bazu');
    } catch (error) {
        console.error('Greška pri unosu podataka:', error);
    } finally {
        await prisma.$disconnect();
    }
}

loadDataToDatabase();
