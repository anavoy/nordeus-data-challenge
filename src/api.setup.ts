import bodyParser from 'body-parser';
import cors from 'cors';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import express from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
dayjs.extend(utc);

import errorHandler from './middleware/errorHandler';
import routes from './routes';

const file = fs.readFileSync(path.resolve(__dirname, '../openapi-endpoints.yaml'), 'utf8');
const swaggerDocument = yaml.parse(file);

const service = express();

// Konfiguracija middlewares
service.use(cors());
service.use(bodyParser.json());
service.use(bodyParser.text());

// Swagger dokumentacija
service.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Postavljanje ruta
routes(service);

// Middleware za greške
service.use(errorHandler);

export default service;
