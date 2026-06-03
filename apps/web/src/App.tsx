import React, { useState, useEffect, useCallback } from 'react';
import { Book } from '@bookshelf/shared';

const PAGE_SIZE = 9;

type Status = 'loading' | 'idle' | 'error';

interface PaginatedBooks {
  data: Book[];
  total: number;
  page: number;
  totalPages: number;
}

function BookCard({ book }: { book: Book }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-amber-200 transition-all duration-200 cursor-default">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full leading-none">
          {book.genre}
        </span>
        <span className="text-xs text-stone-400 shrink-0 mt-0.5">{book.year}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-stone-900 leading-snug line-clamp-2">{book.title}</h3>
        <p className="text-sm text-stone-500 mt-1">{book.author}</p>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-stone-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>
  );
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchBooks = useCallback(async (query: string, currentPage: number) => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const params = `page=${currentPage}&limit=${PAGE_SIZE}`;
      const url = query.trim()
        ? `/api/books/search?q=${encodeURIComponent(query.trim())}&${params}`
        : `/api/books?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: PaginatedBooks = await res.json();
      setBooks(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setStatus('idle');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch books');
      setStatus('error');
    }
  }, []);

  // Debounce: commit the typed value to activeQuery 300 ms after the user stops typing.
  // Resetting page here keeps pagination in sync with every new query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchBooks(activeQuery, page);
  }, [fetchBooks, activeQuery, page]);

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-stone-800 text-amber-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight">📚 BookShelf</h1>
          <p className="text-amber-300 text-sm mt-1">Your personal book catalogue</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Search input */}
        <div className="relative mb-8">
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, author, or genre…"
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <p className="text-center text-stone-500 py-20">Loading books…</p>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium">Could not load books</p>
            <p className="text-stone-400 text-sm mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Results */}
        {status === 'idle' && (
          <>
            {/* Result count when searching */}
            {activeQuery.trim() && (
              <p className="text-sm text-stone-500 mb-4">
                {total === 0
                  ? `No results for "${activeQuery}"`
                  : `${total} result${total !== 1 ? 's' : ''} for "${activeQuery}"`}
              </p>
            )}

            {/* Empty state */}
            {books.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-stone-400 text-lg">
                  {activeQuery.trim()
                    ? 'No books match your search.'
                    : 'No books in the catalogue yet.'}
                </p>
              </div>
            ) : (
              <>
                {/* Book grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-stone-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
