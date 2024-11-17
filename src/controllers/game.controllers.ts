import DateExtension from '@joi/date';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

import prisma from '../utils/prisma';

export const getGameStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validacija i parsiranje datuma iz upita
    const { date } = await Joi.object({
      date: Joi.extend(DateExtension).date().format('YYYY/MM/DD').raw().optional()
    }).validateAsync(req.query || {});

    // Dobijanje ukupnog broja sesija
    const startOfDay = (date && dayjs.utc(date).startOf('day').toDate()) || null;
    const endOfTheDay = date ? dayjs.utc(date).endOf('day').toDate() : null;

    const totalSessions = await prisma.session.count({
      where: {
        ...(date && startOfDay && endOfTheDay
          ? { start_time: { gte: startOfDay, lte: endOfTheDay } }
          : {})
      }
    });

    // Dobijanje prosečnog broja sesija po korisniku

    const avarageUserSessionsResult = date
      ? await prisma.$queryRaw<any[]>`
            SELECT AVG(session_count) AS average_sessions_per_user
            FROM (
                SELECT user_id, COUNT(*) AS session_count
                FROM Session
                WHERE DATE(start_time/1000, 'unixepoch') = ${dayjs(date).format('YYYY-MM-DD')}
                GROUP BY user_id
                HAVING session_count > 0
            ) user_sessions`
      : await prisma.$queryRaw<any[]>`
            SELECT AVG(session_count) AS average_sessions_per_user
            FROM (
                SELECT user_id, COUNT(*) AS session_count
                FROM Session
                GROUP BY user_id
                HAVING session_count > 0
            ) user_sessions`;
    // Dobijanje broja dnevno aktivnih korisnika, filtrirano po datumu ako je dat
    const dailyActiveUsersResult = date
      ? await prisma.$queryRaw<any[]>(
          Prisma.sql`SELECT COUNT(DISTINCT user_id) AS daily_active_users
        FROM Session
        WHERE DATE(start_time/1000, 'unixepoch') = ${dayjs(date).format('YYYY-MM-DD')}`
        )
      : await prisma.$queryRaw<any[]>(
          Prisma.sql`SELECT COUNT(DISTINCT user_id) AS daily_active_users
        FROM Session`
        );

    // Dobijanje korisnika sa najviše golova
    const usersWithMostGoals = startOfDay
      ? await prisma.$queryRaw<any[]>`
            SELECT user_id, SUM(points) AS total_points
            FROM (
                     -- Points as home_user
                     SELECT
                         home_user_id AS user_id,
                         CASE
                             WHEN home_goals_scored > away_goals_scored THEN 3 -- Home win
                             WHEN home_goals_scored = away_goals_scored THEN 1 -- Draw
                             ELSE 0 -- Loss
                             END AS points
                     FROM Match
                     WHERE DATE (start_time/1000, 'unixepoch') = ${dayjs(date).format('YYYY-MM-DD')}

                     UNION ALL

                     -- Points as away_user
                     SELECT
                         away_user_id AS user_id,
                         CASE
                             WHEN away_goals_scored > home_goals_scored THEN 3 -- Away win
                             WHEN away_goals_scored = home_goals_scored THEN 1 -- Draw
                             ELSE 0 -- Loss
                             END AS points
                     FROM Match
                     WHERE DATE (start_time/1000, 'unixepoch') = ${dayjs(date).format('YYYY-MM-DD')}
                 ) user_points
            GROUP BY user_id
            ORDER BY total_points DESC
                LIMIT 5;`
      : await prisma.$queryRaw<any[]>`
        SELECT user_id, SUM(points) AS total_points
        FROM (
                 -- Points as home_user
                 SELECT
                     home_user_id AS user_id,
                     CASE
                         WHEN home_goals_scored > away_goals_scored THEN 3 -- Home win
                         WHEN home_goals_scored = away_goals_scored THEN 1 -- Draw
                         ELSE 0 -- Loss
                         END AS points
                 FROM Match
        
                 UNION ALL
        
                 -- Points as away_user
                 SELECT
                     away_user_id AS user_id,
                     CASE
                         WHEN away_goals_scored > home_goals_scored THEN 3 -- Away win
                         WHEN away_goals_scored = home_goals_scored THEN 1 -- Draw
                         ELSE 0 -- Loss
                         END AS points
                 FROM Match
             ) user_points
        GROUP BY user_id
        ORDER BY total_points DESC
        LIMIT 5;`;

    // Parsiranje broja dnevno aktivnih korisnika iz rezultata
    const dailyActiveUsers =
      dailyActiveUsersResult && Array.isArray(dailyActiveUsersResult)
        ? parseInt(dailyActiveUsersResult[0].daily_active_users, 10)
        : 0;

    // Slanje odgovora sa izračunatom statistikom
    res.status(200).json({
      dailyActiveUsers,
      totalSessions,
      averageSessionsPerUser: avarageUserSessionsResult[0]?.average_sessions_per_user ?? 0,
      usersWithMostGoals: usersWithMostGoals.map((row: any) => {
        return {
          userId: row.user_id,
          totalPoints: parseInt(row.total_points, 10)
        };
      })
    });
    return;
  } catch (error) {
    return next(error);
  }
};
