# Fix Watchlist and Implement Find Opportunities Search

The user reported two main issues:
1. Cannot search for any stocks or cryptocurrencies in the "Find Opportunities" section.
2. Cannot add `amzn` to the watchlist, and the watchlist appears empty.

### Problem Analysis
1. **Find Opportunities Search**: The `SearchWidget.tsx` component currently contains a completely hardcoded dummy input field with no actual search logic implemented.
2. **Watchlist Addition**: 
   - The UX in `Watchlist.tsx` hangs while waiting for Supabase to sync, preventing the input from clearing immediately, causing confusion.
   - If the Vercel proxy or Yahoo Finance API rate-limits the Watchlist fetch requests, the component falls back to displaying "Watchlist is empty" even if the user has symbols in their watchlist (like AAPL or AMZN). This is misleading.

## User Review Required

> [!IMPORTANT]
> The search will be implemented using the Yahoo Finance Search API. This is a public API and may occasionally experience rate limiting depending on your Vercel deployment IP.

## Proposed Changes

### Components

#### [MODIFY] `src/components/SearchWidget.tsx`
- Add state management (`query`, `results`, `isSearching`).
- Implement debounced search fetching from `/api/finance/v1/finance/search`.
- Render a dropdown or list of search results.
- Add an "Add to Watchlist" button for each result, hooked up to `updateProfile` from `useUser`.

#### [MODIFY] `src/components/Watchlist.tsx`
- **UX Fix**: Clear the search input *immediately* when the user clicks the add button, rather than waiting for the Supabase sync to finish.
- **Error Feedback Fix**: If `data.length === 0` but `profile.watchlist.length > 0`, display a "Failed to load data" message instead of "Watchlist is empty" so it's clear the API fetch failed rather than the watchlist actually being empty.

## Verification Plan

### Automated Tests
- Test `SearchWidget.tsx` functionality to ensure debounced API calls fire correctly.
- Test `Watchlist.tsx` to verify input is cleared instantly upon adding.

### Manual Verification
- Type "AMZN" in Find Opportunities and observe the search results.
- Click a search result to verify it adds successfully to the Watchlist.
- Verify the Watchlist handles the new entry properly.
