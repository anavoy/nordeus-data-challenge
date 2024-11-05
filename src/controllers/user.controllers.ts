import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { HttpNotFound } from '../utils/errors.util';

export const getUserStats = async (req: Request, res: Response, next: any) => {
    const { user_id } = req.query;

    try {
        
        if (!user_id) {
            throw new HttpNotFound("User ID is required");
        }

        const user = await prisma.user.findUnique({
            where: { user_id: String(user_id) },
            include: {
                sessions: true,
                homeMatches: true,
                awayMatches: true,
            },
        });

        if (!user) {
            throw new HttpNotFound("User not found");
        }

        res.json({ message: "User found", data: user });
    } catch (error) {
        next(error);  
    }
};
