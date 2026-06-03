# BookShelf Project — Copilot Instructions

BookShelf is an npm workspaces monorepo: Express API (`/apps/api`), React frontend (`/apps/web`), and shared types (`/packages/shared`).

## API Architecture

- **Routes** (`/apps/api/src/routes/books.ts`): Handler logic only; no business logic
- **Services** (`/apps/api/src/services/bookService.ts`): All filtering, pagination, write operations, ID generation
- **Data layer** (`/apps/api/src/data/fileStore.ts`): Sole entry point for JSON file I/O (read/write)
- **Validation** (`/apps/api/src/middleware/validation.ts`): `validateBook` middleware for POST body validation
- **Error handling** (`/apps/api/src/middleware/errorHandler.ts`): `ApiError` class, middleware stack

## API Response Shapes

### Paginated lists

`GET /api/books`, `GET /api/books/search`:

```json
{ "data": [Book, ...], "total": number, "page": number, "totalPages": number }
```

### Single resource

`GET /api/books/:id`: Returns `BookWithReviews` object directly (no wrapper)
`POST /api/books`: Returns new `Book` object, status `201`
`DELETE /api/books/:id`: Returns deleted `Book` object

### All errors

```json
{ "error": { "status": number, "message": string, "details?": [string] } }
```

**Status codes:** `200` (GET), `201` (POST), `400` (bad input), `404` (not found), `500` (write failure)

## Data-Layer Rules

- **File I/O only via fileStore:** Import `bookStore`, `shelfStore`, `reviewStore` from `/apps/api/src/data/fileStore.ts`. Never call `fs` directly or import JSON.
- **Active data location:** `/data/*.json` at project root. Ignore stale `/apps/api/data/books.json`.
- **ID generation:** Use `generateId(prefix)` in fileStore.ts. Format: `${prefix}_<timestamp36><random>` (e.g., `book_mpv2br89vfs5bj`). Never use sequential IDs.

## Validation Rules

`validateBook` middleware trims all string fields. POST /api/books body rules:

- `title`: required, non-empty after trim, max 200 chars
- `author`: required, non-empty after trim
- `genre`: required, non-empty after trim
- `year`: required, integer 1000–current year (inclusive)
- `isbn`, `description`: optional strings; stored as empty string when omitted

Do not duplicate validation logic in routes or services.

## What NOT to Do

- No databases (PostgreSQL, MongoDB, Prisma, TypeORM, Sequelize)
- No authentication, sessions, or user management
- No file I/O outside `fileStore.ts`
- No changes to paginated/error response shapes without explicit instruction
- No new npm dependencies without explicit instruction
- No sequential IDs; always use `generateId()`
- No shelf or review API routes unless explicitly asked
- No `.stack` or raw parser errors in responses
- Preserve middleware order: `express.json()` → routes → `notFoundHandler` → `errorHandler`
