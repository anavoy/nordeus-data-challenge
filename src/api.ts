import dotenv from 'dotenv';
dotenv.config();

import Api from './api.setup';
import prisma from './utils/prisma';

// Povezivanje sa bazom pomoću Prisma klijenta
prisma
  .$connect()
  .then(() => {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

    Api.listen(port, () => {
      console.log(`Express server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log('Failed to connect to the database:', error);
  });
