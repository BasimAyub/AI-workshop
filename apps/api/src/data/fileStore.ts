import fs from 'fs';
import path from 'path';
import { Book, Shelf, Review, ReadingList, UserProfile } from '@bookshelf/shared';

const DATA_DIR = path.resolve(__dirname, '../../../../data');

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readJsonFile = (filename: string): any[] => {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filepath)) {
      return [];
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

const writeJsonFile = (filename: string, data: any[]): void => {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
};

export const bookStore = {
  readAll: (): Book[] => readJsonFile('books.json'),
  writeAll: (books: Book[]): void => writeJsonFile('books.json', books),
};

export const shelfStore = {
  readAll: (): Shelf[] => readJsonFile('shelves.json'),
  writeAll: (shelves: Shelf[]): void => writeJsonFile('shelves.json', shelves),
};

export const reviewStore = {
  readAll: (): Review[] => readJsonFile('reviews.json'),
  writeAll: (reviews: Review[]): void => writeJsonFile('reviews.json', reviews),
};

export const readingListStore = {
  readAll: (): ReadingList[] => readJsonFile('lists.json'),
  writeAll: (lists: ReadingList[]): void => writeJsonFile('lists.json', lists),
};

export const userStore = {
  readAll: (): UserProfile[] => readJsonFile('users.json'),
  writeAll: (users: UserProfile[]): void => writeJsonFile('users.json', users),
};

export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
};
