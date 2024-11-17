import DateExtension from '@joi/date';
import dayjs from 'dayjs';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

import { HttpNotFound } from '../utils/errors.util';
import prisma from '../utils/prisma';

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validacija i parsiranje user_id i datuma iz upita
    const { user_id, date } = await Joi.object({
      user_id: Joi.string().required(),
      date: Joi.extend(DateExtension).date().format('YYYY/MM/DD').raw().optional()
    }).validateAsync(req.query || {});

    // Pronalaženje korisnika po user_id
    const user = await prisma.user.findUnique({
      where: { user_id }
    });

    // Ako korisnik nije pronađen, baciti grešku
    if (!user) {
      throw new HttpNotFound('User not found');
    }

    //How many days have passed since this user last logged in. If no date is
    // specified, calculate how many days have between the last login and today
    // Ako je dat datum, onda dani od zadnjeg logina pre tog datuma do tog datuma
    // Ako nije dat datum, onda dani od zadnjeg logina do danasnjeg datuma

    // Ako je dat datum, kraj tog dana, inače null
    const endOfTheDay = date ? dayjs.utc(date).endOf('day').toDate() : null;

    // Pronalaženje poslednje sesije korisnika
    const lastSession = await prisma.session.findFirst({
      where: {
        user_id,
        ...(date && endOfTheDay ? { start_time: { lte: endOfTheDay } } : {})
      },
      orderBy: {
        start_time: 'desc'
      }
    });

    // Izračunavanje dana od poslednjeg logina
    const daysSinceLastLogin = lastSession
      ? dayjs(endOfTheDay).diff(dayjs(lastSession.start_time), 'day')
      : null;

    // Početak dana ako je dat datum, inače null
    const startOfDay = (date && dayjs.utc(date).startOf('day').toDate()) || null;

    // Pronalaženje svih sesija korisnika
    const sessions = await prisma.session.findMany({
      where: {
        user_id,
        ...(date && startOfDay && endOfTheDay
          ? { start_time: { gte: startOfDay, lte: endOfTheDay } }
          : {})
      }
    });

    // Računanje ukupnog vremena provedenog u igri
    let secondsInGame = null;
    for (const session of sessions) {
      if (session.start_time && session.end_time) {
        if (secondsInGame === null) {
          secondsInGame = 0;
        }
        secondsInGame +=
          (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000;
      }
    }

    // Pronalaženje svih mečeva korisnika
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ home_user_id: user_id }, { away_user_id: user_id }],
        ...(date && startOfDay && endOfTheDay
          ? { start_time: { gte: startOfDay, lte: endOfTheDay } }
          : {})
      }
    });

    // Računanje broja pobeda, nerešenih i poraza, kao i ukupnog vremena provedenog u mečevima
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let secondsInMatches = 0;
    for (const match of matches) {
      if (secondsInMatches === null) {
        secondsInGame = 0;
      }
      secondsInMatches +=
        (new Date(match.end_time).getTime() - new Date(match.start_time).getTime()) / 1000;

      if (match.home_user_id === user_id) {
        if (match.home_goals_scored > match.away_goals_scored) {
          wins++;
        } else if (match.home_goals_scored === match.away_goals_scored) {
          draws++;
        } else {
          losses++;
        }
      } else if (match.away_goals_scored > match.home_goals_scored) {
        wins++;
      } else if (match.away_goals_scored === match.home_goals_scored) {
        draws++;
      } else {
        losses++;
      }
    }

    // Slanje odgovora sa izračunatom statistikom
    res.json({
      data: {
        user: {
          country: user.country,
          registration_time: user.registration_time
        },
        stats: {
          days_since_last_login: daysSinceLastLogin,
          session_count: sessions.length,
          matches: {
            wins,
            draws,
            losses
          },
          points: wins * 3 + draws,
          timeSpentInMatchesPercentage: secondsInGame
            ? Math.round((secondsInMatches * 100) / secondsInGame)
            : null
        }
      }
    });
    return;
  } catch (error) {
    return next(error);
  }
};
