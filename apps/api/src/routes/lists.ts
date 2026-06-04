import { Router, Request, Response, NextFunction } from 'express';
import { readingListService } from '../services/readingListService';
import { validateList, validateListBook } from '../middleware/validation';

const router: Router = Router();

const sendError = (res: Response, status: number, message: string) =>
  res.status(status).json({ error: { status, message } });

router.post(
  '/lists',
  validateList,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const newList = readingListService.createList(req.body);
      res.status(201).json(newList);
    } catch (error) {
      next(error);
    }
  },
);

router.get('/lists', (_req: Request, res: Response) => {
  const lists = readingListService.getAllLists();
  res.json({ data: lists });
});

router.get('/lists/:id', (req: Request, res: Response) => {
  const list = readingListService.getListById(req.params.id);

  if (!list) {
    return sendError(res, 404, 'List not found');
  }

  res.json(list);
});

router.put(
  '/lists/:id/books',
  validateListBook,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = readingListService.addOrRemoveBook(
        req.params.id,
        req.body.bookId,
        req.body.action,
      );

      if (!list) {
        return sendError(res, 404, 'List not found');
      }

      res.json(list);
    } catch (error) {
      next(error);
    }
  },
);

router.delete('/lists/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = readingListService.deleteList(req.params.id);

    if (!deleted) {
      return sendError(res, 404, 'List not found');
    }

    res.json(deleted);
  } catch (error) {
    next(error);
  }
});

export default router;
