import { Request, Response } from 'express';
import { database } from '../config/database';

export const getInventoryList = (_req: Request, res: Response) => {
  return res.json({
    success: true,
    inventory: database.getInventory(),
  });
};
