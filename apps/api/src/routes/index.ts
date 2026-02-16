import { Router, IRouter, Request, Response } from 'express';
import healthRouter from './health';

const router: IRouter = Router();

router.use('/health', healthRouter);

// 404 catch-all
router.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', code: 'NOT_FOUND' });
});

export default router;
