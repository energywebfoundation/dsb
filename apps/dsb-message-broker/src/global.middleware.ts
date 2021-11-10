import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function GlobalMiddleware(req: Request, res: Response, next: NextFunction) {
    req.app.locals.uuid = uuidv4();
    next();
}
