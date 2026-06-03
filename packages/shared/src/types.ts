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
