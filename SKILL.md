# Skill: Scaffold BookShelf API Endpoint

## When to use
Use this skill when adding a new REST endpoint to the BookShelf API (`apps/api/`). It covers everything from route handler through service method, data access, validation, error handling, and tests.

---

## Required steps
1. Add the route handler to [apps/api/src/routes/books.ts](apps/api/src/routes/books.ts).
2. Add the service method to [apps/api/src/services/bookService.ts](apps/api/src/services/bookService.ts).
3. If the endpoint needs body validation, add a middleware function to [apps/api/src/middleware/validation.ts](apps/api/src/middleware/validation.ts) and apply it before the route handler.
4. Add route tests to [apps/api/tests/books.test.ts](apps/api/tests/books.test.ts) when the endpoint is part of the books API.

Do **not** touch [apps/api/src/data/fileStore.ts](apps/api/src/data/fileStore.ts) unless you need a new store or the `generateId` helper.

---

## Route-layer rules ([apps/api/src/routes/books.ts](apps/api/src/routes/books.ts))
- Handlers must be **thin**: read already-validated request values, call one service method, and return the result.
- No business logic, filtering, pagination math, or ID generation belongs here.
- Use the file-local `sendError(res, status, message)` helper for all inline error responses.
- Use the file-local `getQueryString(value)` helper to coerce and trim query parameters.
- Wrap any service call that can throw in `try/catch` and forward the error with `next(error)`.
- Register static path segments before parameterised ones (e.g. `/books/search` before `/books/:id`).

**Response shapes by method:**
| Scenario | Status | Body |
|---|---|---|
| Paginated list | `200` | `{ data: T[], total, page, totalPages }` |
| Single resource | `200` | The object directly (no wrapper) |
| Created resource | `201` | The new object directly |
| Deleted resource | `200` | The deleted object directly |
| Bad input | `400` | `{ error: { status, message } }` (validation errors add `details: string[]`) |
| Not found | `404` | `{ error: { status, message } }` |
| Write failure | `500` | `{ error: { status, message } }` |

---
## Service-layer rules ([apps/api/src/services/bookService.ts](apps/api/src/services/bookService.ts))

- All filtering, pagination, sorting, ID generation, and write logic lives here.
- Read data via `bookStore.readAll()`, `shelfStore.readAll()`, or `reviewStore.readAll()`.
- Persist data via `bookStore.writeAll(items)`, `shelfStore.writeAll(items)`, or `reviewStore.writeAll(items)`.
- Generate IDs with `generateId(prefix)` — format: `${prefix}_<timestamp36><random>` (e.g. `book_mpv2br89vfs5bj`). Never use sequential IDs like `book_001`.
- Wrap every `writeAll` call in `try/catch` and throw `new ApiError(500, 'Failed to …')` on failure. Never let raw `fs` errors escape the service.
- Return `null` (not an `ApiError`) when a resource is not found; the route handler converts that to a `404`.
- Import `ApiError` from `../middleware/errorHandler`.

```typescript
// Pattern for a mutating method
import { ApiError } from '../middleware/errorHandler';

someMethod(id: string): SomeType | null {
  const items = someStore.readAll();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  // … mutate items …

  try {
    someStore.writeAll(items);
  } catch {
    throw new ApiError(500, 'Failed to update item');
  }

  return items[index];
}
```

---

## Data-layer rules ([apps/api/src/data/fileStore.ts](apps/api/src/data/fileStore.ts))

- `bookStore`, `shelfStore`, and `reviewStore` are the **only** entry points for JSON file I/O.
- Never import `fs`, read JSON with `require()`, or access `/data/*.json` directly from routes or services.
- Active data files live at root `/data/` (`books.json`, `shelves.json`, `reviews.json`). Ignore `/apps/api/data/books.json` — it is a stale artifact.
- The available stores and their types:

```typescript
import { bookStore, shelfStore, reviewStore, generateId } from '../data/fileStore';
// bookStore  → { readAll(): Book[];   writeAll(items: Book[]): void }
// shelfStore → { readAll(): Shelf[];  writeAll(items: Shelf[]): void }
// reviewStore→ { readAll(): Review[]; writeAll(items: Review[]): void }
```

---

## Validation / error-handling rules

- Body validation belongs in a dedicated middleware function in [apps/api/src/middleware/validation.ts](apps/api/src/middleware/validation.ts), applied as a second argument to the route: `router.post('/…', validateXxx, handler)`.
- Collect **all** field errors before returning so the client receives the full list at once.
- Respond with `{ error: { status: 400, message: 'Validation failed', details: string[] } }` on failure.
- Trim all incoming strings in the middleware before calling `next()`, so the route handler receives clean values.
- `ApiError` propagates through `errorHandler` automatically — never catch and re-serialise it yourself.
- Do not expose `err.stack` or raw Express parser messages in responses.
- Middleware registration order in `index.ts` must remain: `express.json()` → routes → `notFoundHandler` → `errorHandler`.

---

## Testing rules ([apps/api/tests/books.test.ts](apps/api/tests/books.test.ts))

- Mock `bookService` at the module level with `jest.mock('../src/services/bookService')`.  **Do not mock `fileStore`** in route tests.
- Cast the mock: `const mockedBookService = bookService as jest.Mocked<typeof bookService>`.
- Use inline fixture objects — never read from or write to `/data/*.json` in tests.
- Call `jest.clearAllMocks()` in a `beforeEach` inside each `describe` block.
- Build the test app the same way as the existing suite:

```typescript
const app = express();
app.use(express.json());
app.use('/api', bookRoutes);
app.use(errorHandler);
```

**Required test cases for every new endpoint:**

| Case | How |
|---|---|
| Success (happy path) | Mock service to return fixture; assert status + body shape |
| Each required field missing or invalid | Send bad payload; assert `400` + `error.details` content |
| Resource not found | Mock service to return `null`; assert `404` |
| Write failure (mutating endpoints) | Mock service to throw `new ApiError(500, …)`; assert `500` |

---

## What NOT to do
- Do not call `fs` or import JSON files directly in routes or services.
- Do not add business logic (filtering, pagination, ID generation) in route handlers.
- Do not duplicate body-validation logic between middleware and the route or service.
- Do not use sequential IDs (`book_001`); always use `generateId('prefix')`.
- Do not add `details` to error responses that are not validation errors.
- Do not skip `try/catch` around `writeAll` calls in the service.
- Do not expose `err.stack` in API responses.
- Do not add PostgreSQL, MongoDB, Prisma, or any other database.
- Do not add npm dependencies without explicit instruction.
- Do not change the middleware registration order.
- Do not mock `fileStore` in route tests — mock `bookService` only.

---

## Example: `DELETE /api/books/:id`

This endpoint is already implemented. Use it as the canonical template.

**Route handler** ([apps/api/src/routes/books.ts](apps/api/src/routes/books.ts), `router.delete` block):
```typescript
router.delete('/books/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = bookService.deleteBook(req.params.id);
    if (!deleted) {
      return sendError(res, 404, 'Book not found');
    }
    res.json(deleted);
  } catch (error) {
    next(error);
  }
});
```

**Service method** ([apps/api/src/services/bookService.ts](apps/api/src/services/bookService.ts), `deleteBook` method):
```typescript
deleteBook(id: string): Book | null {
  const books = bookStore.readAll();
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const [deleted] = books.splice(index, 1);

  // Remove the deleted book's ID from every shelf's bookIds array.
  const shelves = shelfStore.readAll();
  const updatedShelves = shelves.map((s) => ({
    ...s,
    bookIds: s.bookIds.filter((bid) => bid !== id),
  }));

  try {
    bookStore.writeAll(books);
    shelfStore.writeAll(updatedShelves);
  } catch {
    throw new ApiError(500, 'Failed to delete book');
  }

  return deleted;
}
```

**Test skeleton** (to be added to [apps/api/tests/books.test.ts](apps/api/tests/books.test.ts)):
```typescript
describe('DELETE /api/books/:id', () => {
  const bookFixture = {
    id: 'book_mpv2br89vfs5bj',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    year: 1925,
    isbn: '',
    description: '',
    coverUrl: null,
    addedAt: '2026-06-03T00:00:00.000Z',
  };

  beforeEach(() => { jest.clearAllMocks(); });

  it('should delete an existing book and return it', async () => {
    mockedBookService.deleteBook.mockReturnValue(bookFixture);
    const res = await request(app).delete(`/api/books/${bookFixture.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: bookFixture.id, title: bookFixture.title });
    expect(mockedBookService.deleteBook).toHaveBeenCalledWith(bookFixture.id);
  });

  it('should return 404 when book is not found', async () => {
    mockedBookService.deleteBook.mockReturnValue(null);
    const res = await request(app).delete('/api/books/book_doesnotexist');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Book not found');
  });

  it('should return 500 when the write fails', async () => {
    mockedBookService.deleteBook.mockImplementation(() => {
      throw new ApiError(500, 'Failed to delete book');
    });
    const res = await request(app).delete(`/api/books/${bookFixture.id}`);
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Failed to delete book');
  });
});
```
