import { UserProfile, UserActivity } from '@bookshelf/shared';
import { userStore, shelfStore, reviewStore, bookStore, generateId } from '../data/fileStore';
import { ApiError } from '../middleware/errorHandler';

interface UserInput {
  displayName: string;
  avatarUrl?: string;
  favoriteGenres?: string[];
}

const computeStats = (userId: string): UserProfile['readingStats'] => {
  const shelves = shelfStore.readAll().filter((s) => s.userId === userId);
  const totalBooks = new Set(shelves.flatMap((s) => s.bookIds)).size;
  const reviewedBooks = reviewStore.readAll().filter((r) => r.userId === userId).length;
  return { totalBooks, finishedBooks: 0, reviewedBooks };
};

export const userService = {
  createUser(input: UserInput): UserProfile {
    const users = userStore.readAll();
    const now = new Date().toISOString();
    const user: UserProfile = {
      id: generateId('user'),
      displayName: input.displayName,
      avatarUrl: input.avatarUrl ?? '',
      favoriteGenres: input.favoriteGenres ?? [],
      readingStats: { totalBooks: 0, finishedBooks: 0, reviewedBooks: 0 },
      createdAt: now,
      updatedAt: now,
    };
    try {
      userStore.writeAll([...users, user]);
    } catch {
      throw new ApiError(500, 'Failed to save user');
    }
    return user;
  },

  getUserById(id: string): UserProfile | null {
    const user = userStore.readAll().find((u) => u.id === id);
    if (!user) return null;
    return { ...user, readingStats: computeStats(id) };
  },

  updateUser(id: string, input: UserInput): UserProfile | null {
    const users = userStore.readAll();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    const updated: UserProfile = {
      ...users[index],
      displayName: input.displayName,
      avatarUrl: input.avatarUrl ?? users[index].avatarUrl,
      favoriteGenres: input.favoriteGenres ?? users[index].favoriteGenres,
      updatedAt: new Date().toISOString(),
    };
    users[index] = updated;
    try {
      userStore.writeAll(users);
    } catch {
      throw new ApiError(500, 'Failed to save user');
    }
    return { ...updated, readingStats: computeStats(id) };
  },

  getActivity(id: string): UserActivity[] | null {
    const exists = userStore.readAll().some((u) => u.id === id);
    if (!exists) return null;

    const books = bookStore.readAll();
    const bookTitle = (bookId: string) =>
      books.find((b) => b.id === bookId)?.title ?? 'a book';

    const reviewActivities: UserActivity[] = reviewStore
      .readAll()
      .filter((r) => r.userId === id)
      .map((r) => ({
        type: 'review' as const,
        message: `Reviewed "${bookTitle(r.bookId)}"`,
        createdAt: r.createdAt,
      }));

    const shelfActivities: UserActivity[] = shelfStore
      .readAll()
      .filter((s) => s.userId === id)
      .map((s) => ({
        type: 'shelf' as const,
        message: `Created shelf "${s.name}"`,
        createdAt: s.createdAt,
      }));

    return [...reviewActivities, ...shelfActivities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
};
