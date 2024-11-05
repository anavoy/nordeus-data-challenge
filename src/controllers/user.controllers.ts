import { NextFunction, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { HttpNotFound } from '../utils/errors.util';

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id, date } = req.query;

    try {
        // Provera da li je `user_id` prosleđen kao parametar
        if (!user_id) {
            throw new HttpNotFound("User ID is required");
        }

        // Pronalaženje korisnika u bazi
        const user = await prisma.user.findUnique({
            where: { user_id: String(user_id) },
            include: {
                sessions: true,
                homeMatches: true,
                awayMatches: true,
            },
        });

        // Ako korisnik ne postoji, baca `HttpNotFound` grešku
        if (!user) {
            throw new HttpNotFound("User not found");
        }

        res.json({ message: "User found", data: user });
    } catch (error) {
        next(error);  // Prosledi grešku do `errorHandler` middleware-a
    }
};
