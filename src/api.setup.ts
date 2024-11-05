import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

import errorHandler from './middleware/errorHandler';
import routes from './routes';
import Logger from './utils/logger.util';

const service = express();

// Konfiguracija middlewares
service.use(cors());
service.use(bodyParser.json());
service.use(bodyParser.text());

// Postavljanje ruta
routes(service);

// Middleware za greške
service.use(errorHandler);

// Logovanje pokretanja servera
Logger.info('Express app setup completed.');

export default service;
