import prisma from '../utils/prisma';

export async function loadTimezones(timezonesData: any[]) {
  console.log('== Vremenske zone ucitavanje.');

  // Mogli bi da koristimo samo createMany sa skipDuplicates
  // ali to nije moguce sa sqlite-om, pa moramo da proverimo sta vec postoji u bazi
  const existingTimezones = await prisma.timezone.findMany({
    where: {
      country: { in: timezonesData.map((tz: { country: any }) => tz.country) }
    },
    select: { country: true }
  });

  const newTimezones = timezonesData
    .filter((tz: { country: string }) => !existingTimezones.some((et) => et.country === tz.country))
    .map((timezone: { country: any; timezone: any }) => ({
      country: timezone.country,
      timezone: timezone.timezone
    }));

  await prisma.timezone.createMany({ data: newTimezones });

  console.log('=> Vremenske zone uspešno učitane.');
}
