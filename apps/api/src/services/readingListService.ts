import { ReadingList, ReadingListWithBooks } from '@bookshelf/shared';
import { bookStore, readingListStore, generateId } from '../data/fileStore';
import { ApiError } from '../middleware/errorHandler';

export interface CreateListInput {
  name: string;
  description?: string;
}

export class ReadingListService {
  createList(data: CreateListInput): ReadingList {
    const lists = readingListStore.readAll();
    const now = new Date().toISOString();
    const newList: ReadingList = {
      id: generateId('list'),
      name: data.name,
      description: data.description ?? '',
      bookIds: [],
      createdAt: now,
      updatedAt: now,
    };

    lists.push(newList);

    try {
      readingListStore.writeAll(lists);
    } catch {
      throw new ApiError(500, 'Failed to create reading list');
    }

    return newList;
  }

  getAllLists(): ReadingList[] {
    return readingListStore.readAll();
  }

  getListById(id: string): ReadingListWithBooks | null {
    const lists = readingListStore.readAll();
    const list = lists.find((l) => l.id === id);

    if (!list) {
      return null;
    }

    const allBooks = bookStore.readAll();
    const books = list.bookIds
      .map((bookId) => allBooks.find((b) => b.id === bookId))
      .filter((b): b is NonNullable<typeof b> => b !== undefined);

    return { ...list, books };
  }

  addOrRemoveBook(id: string, bookId: string, action: 'add' | 'remove'): ReadingList | null {
    const lists = readingListStore.readAll();
    const index = lists.findIndex((l) => l.id === id);

    if (index === -1) {
      return null;
    }

    const list = lists[index];

    if (action === 'add') {
      const allBooks = bookStore.readAll();
      if (!allBooks.some((b) => b.id === bookId)) {
        throw new ApiError(404, 'Book not found');
      }

      if (list.bookIds.includes(bookId)) {
        return list;
      }

      list.bookIds = [...list.bookIds, bookId];
    } else {
      if (!list.bookIds.includes(bookId)) {
        return list;
      }

      list.bookIds = list.bookIds.filter((bid) => bid !== bookId);
    }

    list.updatedAt = new Date().toISOString();
    lists[index] = list;

    try {
      readingListStore.writeAll(lists);
    } catch {
      throw new ApiError(500, 'Failed to update reading list');
    }

    return list;
  }

  deleteList(id: string): ReadingList | null {
    const lists = readingListStore.readAll();
    const index = lists.findIndex((l) => l.id === id);

    if (index === -1) {
      return null;
    }

    const [deleted] = lists.splice(index, 1);

    try {
      readingListStore.writeAll(lists);
    } catch {
      throw new ApiError(500, 'Failed to delete reading list');
    }

    return deleted;
  }
}

export const readingListService = new ReadingListService();
