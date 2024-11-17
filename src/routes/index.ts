import { Express } from 'express';

import * as GameController from '../controllers/game.controllers';
import * as UserController from '../controllers/user.controllers';
import { HttpNotFound } from '../utils/errors.util';

const routes = (app: Express) => {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.removeHeader('X-Powered-By');
    next();
  });

  // app.get('/v1/health-check', (_req, res) => res.status(200).send({ status: 'OK' }));

  app.get('/v1/user', UserController.getUserStats);
  app.get('/v1/game', GameController.getGameStats);

  app.use((_req, _res, next) => next(new HttpNotFound('Route not found')));
};

export default routes;
