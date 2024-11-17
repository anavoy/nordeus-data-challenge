import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ValidationError } from 'joi';

import { HttpError, HttpInternalServerError, HttpValidationError } from '../utils/errors.util';

const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let stackTrace;

  if (process.env.ERROR_STACK === '1') {
    stackTrace = error.stack;
  }

  if (error instanceof ValidationError) {
    error = new HttpValidationError(error.details[0].message, error.details[0]);
  }

  if (!(error instanceof HttpError)) {
    console.error(error);
    error = new HttpInternalServerError();
  }

  const errorData = {
    type: error.constructor.name,
    message: error.message,
    code: error instanceof HttpError ? error.statusCode : 500,
    data: error instanceof HttpError && error.data ? error.data : {},
    stackTrace
  };

  if (res.headersSent) {
    res.write(JSON.stringify({ error: errorData }));
  } else {
    res.status(errorData.code).send({ error: errorData });
  }
};

export default errorHandler;
