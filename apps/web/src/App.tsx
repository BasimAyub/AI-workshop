import React, { useState, useEffect, useCallback } from 'react';
import { Book, Review } from '@bookshelf/shared';

const PAGE_SIZE = 9;

type Status = 'loading' | 'idle' | 'error';

interface PaginatedBooks {
  data: Book[];
  total: number;
  page: number;
  totalPages: number;
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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl leading-none transition-colors ${
            star <= value ? 'text-amber-400' : 'text-stone-300 hover:text-amber-300'
          }`}
          aria-label={`Rate ${star} out of 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? 'text-amber-400' : 'text-stone-300'}>
          ★
        </span>
      ))}
    </span>
  );
}

function ReviewsPanel({ book, onClose }: { book: Book; onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsStatus, setReviewsStatus] = useState<Status>('loading');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  const fetchReviews = useCallback(async () => {
    setReviewsStatus('loading');
    try {
      const res = await fetch(`/api/books/${book.id}/reviews`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Review[] = await res.json();
      setReviews(data);
      setReviewsStatus('idle');
    } catch {
      setReviewsStatus('error');
    }
  }, [book.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitStatus('submitting');
    setSubmitError('');
    try {
      const res = await fetch(`/api/books/${book.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, text: text.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      setRating(5);
      setText('');
      setSubmitStatus('idle');
      await fetchReviews();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review');
      setSubmitStatus('error');
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reviews for ${book.title}`}
        className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-stone-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full leading-none">
                {book.genre}
              </span>
              <span className="text-xs text-stone-400">{book.year}</span>
            </div>
            <h2 className="font-semibold text-stone-900 leading-snug mt-1.5">{book.title}</h2>
            <p className="text-sm text-stone-500 mt-0.5">{book.author}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-stone-400 hover:text-stone-700 text-lg leading-none mt-0.5 transition-colors"
            aria-label="Close reviews panel"
          >
            ✕
          </button>
        </div>

        {/* Reviews list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Reviews
            {reviewsStatus === 'idle' && reviews.length > 0 && (
              <span className="ml-2 normal-case font-medium text-stone-500">
                ({reviews.length})
              </span>
            )}
          </h3>

          {reviewsStatus === 'loading' && (
            <p className="text-stone-400 text-sm text-center py-8">Loading reviews…</p>
          )}

          {reviewsStatus === 'error' && (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">Could not load reviews.</p>
              <button
                onClick={fetchReviews}
                className="text-xs text-amber-600 hover:text-amber-700 mt-2 underline"
              >
                Try again
              </button>
            </div>
          )}

          {reviewsStatus === 'idle' && reviews.length === 0 && (
            <p className="text-stone-400 text-sm text-center py-8">
              No reviews yet. Be the first!
            </p>
          )}

          {reviewsStatus === 'idle' &&
            reviews.map((review) => (
              <div
                key={review.id}
                className="bg-stone-50 rounded-xl p-4 border border-stone-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <StarDisplay value={review.rating} />
                  <span className="text-xs text-stone-400">
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">{review.text}</p>
              </div>
            ))}
        </div>

        {/* Add review form */}
        <div className="border-t border-stone-100 p-5 bg-white">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Add a review
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your review…"
              rows={3}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
            />
            {submitStatus === 'error' && (
              <p className="text-xs text-red-500">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitStatus === 'submitting' || !text.trim()}
              className="w-full py-2 rounded-xl text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitStatus === 'submitting' ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-amber-200 transition-all duration-200 cursor-pointer w-full"
    >
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
      <p className="text-xs text-amber-600 font-medium">Reviews →</p>
    </button>
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
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

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
                    <BookCard
                      key={book.id}
                      book={book}
                      onClick={() => setSelectedBook(book)}
                    />
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

      {/* Reviews panel */}
      {selectedBook && (
        <ReviewsPanel book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}
