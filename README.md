# BookShelf - Personal Book Catalogue Application

A Node.js monorepo for managing a personal book collection with a backend API and web interface.

## Project Structure

```
bookshelf/
├── apps/
│   ├── api/          # Express.js backend API
│   └── web/          # React frontend application
├── packages/
│   └── shared/       # Shared types and utilities
├── data/             # JSON data store
│   ├── books.json
│   ├── shelves.json
│   └── reviews.json
└── README.md
```

## Prerequisites

- **Node.js v20+** (required)
- npm v10+ (comes with Node.js)

## Installation

Install dependencies for all workspaces:

```bash
npm install
```

This will install dependencies for:

- Root workspace
- `apps/api`
- `apps/web`
- `packages/shared`

## Starting the Development Server

Start the backend API on port 3001:

```bash
npm run dev
```

The API will start and listen on `http://localhost:3001`

## Building

Build all packages:

```bash
npm run build
```

## API Endpoints

### Health Check

```bash
curl http://localhost:3001/api/health
```

Response:

```json
{
  "status": "ok"
}
```

### Get All Books

```bash
curl http://localhost:3001/api/books
```

With filters:

```bash
# Filter by genre
curl "http://localhost:3001/api/books?genre=Technology"

# Filter by author
curl "http://localhost:3001/api/books?author=David"

# Filter by year
curl "http://localhost:3001/api/books?year=2008"

# Combine filters
curl "http://localhost:3001/api/books?genre=Fiction&year=1960"
```

### Get Single Book with Reviews

```bash
curl http://localhost:3001/api/books/book_001
```

Response includes the book with all associated reviews.

### Search Books

Search by title, author, or genre:

```bash
curl "http://localhost:3001/api/books/search?q=Pragmatic"
curl "http://localhost:3001/api/books/search?q=David"
curl "http://localhost:3001/api/books/search?q=Technology"
```

**Note:** The `q` parameter is required. Missing it returns a 400 error.

### Create a New Book

```bash
curl -X POST http://localhost:3001/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JavaScript: The Good Parts",
    "author": "Douglas Crockford",
    "genre": "Technology",
    "year": 2008,
    "isbn": "978-0596517748",
    "description": "Essential JavaScript programming guide"
  }'
```

Required fields:

- `title` (string)
- `author` (string)
- `genre` (string)
- `year` (number)

Optional fields:

- `isbn` (string)
- `description` (string)

Response:

```json
{
  "id": "book_031",
  "title": "JavaScript: The Good Parts",
  "author": "Douglas Crockford",
  "genre": "Technology",
  "year": 2008,
  "isbn": "978-0596517748",
  "description": "Essential JavaScript programming guide",
  "coverUrl": null,
  "addedAt": "2026-06-01T12:00:00Z"
}
```

## Data Storage

All data is stored as JSON files in the `/data` directory:

- **books.json** - Contains 30 seed books
- **shelves.json** - Contains 3 sample shelves
- **reviews.json** - Contains 10 sample reviews

Each time the API creates a new book, it's persisted to `books.json`.

## Data Schemas

### Book

```typescript
{
  "id": "book_001",
  "title": "The Pragmatic Programmer",
  "author": "David Thomas, Andrew Hunt",
  "genre": "Technology",
  "year": 1999,
  "isbn": "978-0135957059",
  "description": "A guide to software craftsmanship...",
  "coverUrl": null,
  "addedAt": "2025-01-15T10:30:00Z"
}
```

### Shelf

```typescript
{
  "id": "shelf_001",
  "userId": "user_001",
  "name": "Currently Reading",
  "bookIds": ["book_001", "book_003"],
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### Review

```typescript
{
  "id": "review_001",
  "bookId": "book_001",
  "userId": "user_001",
  "rating": 5,
  "text": "Essential reading for any developer...",
  "createdAt": "2025-01-20T14:00:00Z"
}
```

## Workspaces

### `@bookshelf/api`

Express.js backend server with:

- Clean data access layer
- Request validation middleware
- Error handling middleware
- Type-safe routes

### `@bookshelf/web`

React frontend scaffold with:

- TypeScript support
- Component structure
- CSS styling
- Ready for development

### `@bookshelf/shared`

Shared package containing:

- Common TypeScript types (Book, Shelf, Review)
- Shared utilities

## Error Handling

The API returns error responses with descriptive messages:

```json
{
  "error": {
    "status": 400,
    "message": "Validation failed",
    "details": ["title is required and must be a non-empty string"]
  }
}
```

## Testing the API

### Complete Test Flow

```bash
# 1. Start the API
npm run dev

# 2. In a new terminal, check health
curl http://localhost:3001/api/health

# 3. Get all books
curl http://localhost:3001/api/books | jq '.[0]'

# 4. Get a specific book with reviews
curl http://localhost:3001/api/books/book_001 | jq '.reviews'

# 5. Search for books
curl "http://localhost:3001/api/books/search?q=Technology" | jq '.[] | .title'

# 6. Create a new book
curl -X POST http://localhost:3001/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Book",
    "author": "New Author",
    "genre": "Fiction",
    "year": 2025
  }' | jq '.id'
```

## Development

### Project Scripts

| Command         | Description                             |
| --------------- | --------------------------------------- |
| `npm install`   | Install dependencies for all workspaces |
| `npm run dev`   | Start the API in development mode       |
| `npm run build` | Build all packages                      |
| `npm run test`  | Run tests for all packages              |

### TypeScript Configuration

- **Strict mode** enabled for type safety
- **ESM and CommonJS** support configured
- **Shared base config** for consistency

## Architecture

- **Monorepo**: Using npm workspaces
- **Backend**: Express.js with TypeScript
- **Data**: JSON files (no database)
- **Shared Types**: Centralized in `@bookshelf/shared`

## Next Steps

### Frontend Development

- Build components to display books
- Create search and filter UI
- Add book creation form
- Integrate with API endpoints

### Backend Enhancement

- Add shelf management endpoints
- Add review management endpoints
- Implement user authentication
- Add pagination support
