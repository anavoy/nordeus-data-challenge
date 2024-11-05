import prisma from './utils/prisma';
import { loadJsonlData } from './utils/loadData.util';

const eventsData = loadJsonlData('../data/events.jsonl');
const timezonesData = loadJsonlData('../data/timezones.jsonl');

async function loadDataToDatabase() {
    console.log("Current working directory:", process.cwd());
    try {
        
        const existingTimezones = await prisma.timezone.findMany({
            where: {
                country: { in: timezonesData.map(tz => tz.country) }
            },
            select: { country: true }
        });
        const newTimezones = timezonesData
            .filter(tz => !existingTimezones.some(et => et.country === tz.country))
            .map(timezone => ({
                country: timezone.country,
                timezone: timezone.timezone,
            }));

        await prisma.timezone.createMany({ data: newTimezones });
        console.log('Vremenske zone uspešno ');

       
        const existingUsers = await prisma.user.findMany({
            where: {
                user_id: { in: eventsData.filter(event => event.event_type === 'registration').map(event => event.user_id) }
            },
            select: { user_id: true }
        });
        const newUserEntries = eventsData
            .filter(event => event.event_type === 'registration' && event.user_id)
            .filter(event => !existingUsers.some(user => user.user_id === event.user_id))
            .map(event => ({
                user_id: event.user_id,
                country: event.country,
                device_os: event.device_os,
                registration_date: new Date(event.event_timestamp * 1000),
            }));

        await prisma.user.createMany({ data: newUserEntries });
        console.log('Korisnici uspešno ');


        const sessionEntries = eventsData
            .filter(event => event.event_type === 'session_ping' && event.user_id)
            .map(event => ({
                user_id: event.user_id,
                start_time: new Date(event.start_time * 1000),
                end_time: event.end_time ? new Date(event.end_time * 1000) : null,
            }));

        await prisma.session.createMany({ data: sessionEntries });
        console.log('Sesije uspeno uitane');

       
        const matchEntries = eventsData
            .filter(event => event.event_type === 'match' && event.home_user_id && event.away_user_id)
            .map(event => ({
                match_id: event.match_id,
                home_user_id: event.home_user_id,
                away_user_id: event.away_user_id,
                home_goals_scored: event.home_goals_scored,
                away_goals_scored: event.away_goals_scored,
                match_start: new Date(event.match_start * 1000),
                match_end: event.match_end ? new Date(event.match_end * 1000) : null,
            }));

        await prisma.match.createMany({ data: matchEntries });
        console.log('Meevi uspešno uitani');
    } catch (error) {
        console.error('Greka pri unosu podataka:', error);
    } finally {
        await prisma.$disconnect();
    }
}

loadDataToDatabase();
