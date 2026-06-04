export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  year: number;
  isbn: string;
  description: string;
  coverUrl: string | null;
  addedAt: string;
}

export interface Shelf {
  id: string;
  userId: string;
  name: string;
  bookIds: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface BookWithReviews extends Book {
  reviews: Review[];
}

export interface ReadingList {
  id: string;
  name: string;
  description: string;
  bookIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReadingListWithBooks extends ReadingList {
  books: Book[];
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string;
  favoriteGenres: string[];
  readingStats: {
    totalBooks: number;
    finishedBooks: number;
    reviewedBooks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserActivity {
  type: 'review' | 'shelf';
  message: string;
  createdAt: string;
}
