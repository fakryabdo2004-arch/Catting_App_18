import type { Response } from "express";

export interface ISuccessMeta {
  page?: number;
  perPage?: number;
  total?: number;
  [k: string]: unknown;
}

export interface ISuccessEntity<T = unknown> {
  message: string;
  data?: T;
  meta?: ISuccessMeta;
}

export const success = <T>(res: Response, status = 200, payload: ISuccessEntity<T>) => {
  return res.status(status).json(payload);
};

export const entity = <T>(data: T, message = "OK"): ISuccessEntity<T> => ({ message, data });
export const entities = <T>(data: T[], message = "OK", meta?: ISuccessMeta): ISuccessEntity<T[]> => ({
  message,
  data,
  meta: meta ?? { total: data.length },
});
