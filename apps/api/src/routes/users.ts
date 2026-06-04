import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { validateUser } from '../middleware/validation';

const router: Router = Router();

const sendError = (res: Response, status: number, message: string) =>
  res.status(status).json({ error: { status, message } });

router.post('/users', validateUser, (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', (req: Request, res: Response) => {
  const user = userService.getUserById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');
  res.json(user);
});

router.put('/users/:id', validateUser, (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = userService.updateUser(req.params.id, req.body);
    if (!user) return sendError(res, 404, 'User not found');
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id/activity', (req: Request, res: Response) => {
  const activity = userService.getActivity(req.params.id);
  if (!activity) return sendError(res, 404, 'User not found');
  res.json({ data: activity });
});

export default router;
