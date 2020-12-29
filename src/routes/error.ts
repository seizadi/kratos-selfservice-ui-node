import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { Configuration, PublicApi } from '@oryd/kratos-client';
import { isString } from '../helpers';
import { AxiosError } from 'axios';
import urljoin from "url-join";

const kratos = new PublicApi(new Configuration({ basePath: config.kratos.public }));

export default (req: Request, res: Response, next: NextFunction) => {
  const error = req.query.error;

  if (!error || !isString(error)) {
    // No error was send, redirecting back to home.
    res.redirect(urljoin(config.pathPrefix, '/'));
    return;
  }

  console.log('Error Processing call Kratos', config.kratos.public)
  kratos
    .getSelfServiceError(error)
    .then(({ status, data: body }) => {
      if ('errors' in body) {
        console.log('Error in body!!')
        res.status(500).render('error', {
          message: JSON.stringify(body.errors, null, 2),
        });
        console.log('Got Error Message to resolve.')
        return Promise.resolve();
      }

      return Promise.reject(
        `expected errorContainer to contain "errors" but got ${JSON.stringify(
          body,
        )}`,
      );
    })
    .catch((err: AxiosError) => {
      console.log('Got Axios Error.')
      if (!err.response) {
        next(err);
        return;
      }

      if (err.response.status === 404) {
        // The error could not be found, redirect back to home.
        res.redirect(urljoin(config.pathPrefix, '/'));
        return;
      }

      next(err);
    });
}
