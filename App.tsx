
import React, { useState, useCallback, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { TranslationDisplay } from './components/TranslationDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { SearchHistoryDisplay } from './components/SearchHistoryDisplay'; // New component
import { fetchTranslations } from './services/geminiService';
import type { TranslationEntry } from './types';
import { GEMINI_MODEL_NAME, LOCAL_STORAGE_HISTORY_KEY, MAX_HISTORY_ITEMS } from './constants';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [translations, setTranslations] = useState<TranslationEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage on initial render
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load search history from localStorage:", e);
      setSearchHistory([]);
    }
  }, []);

  const updateSearchHistory = useCallback((newTerm: string) => {
    const termToAdd = newTerm.trim();
    if (!termToAdd) return;

    setSearchHistory(prevHistory => {
      // Normalize for comparison to avoid case-sensitive duplicates in filtering, but store original casing.
      const lowercasedTermToAdd = termToAdd.toLowerCase();
      const filteredHistory = prevHistory.filter(item => item.toLowerCase() !== lowercasedTermToAdd);
      const updatedHistory = [termToAdd, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to save search history to localStorage:", e);
      }
      return updatedHistory;
    });
  }, []);

  const handleSearch = useCallback(async (term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setError("Please enter a word to search.");
      setTranslations(null);
      return;
    }
    
    updateSearchHistory(trimmedTerm); // Add to history

    setSearchTerm(trimmedTerm);
    setIsLoading(true);
    setError(null);
    setTranslations(null);

    try {
      const results = await fetchTranslations(trimmedTerm);
      if (results.length === 0) {
        setError(`No translation found for "${trimmedTerm}". Try another word.`);
        setTranslations(null);
      } else {
        setTranslations(results);
      }
    } catch (err) {
      console.error("Translation fetch error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please ensure your API key is set up correctly.");
      setTranslations(null);
    } finally {
      setIsLoading(false);
    }
  }, [updateSearchHistory]);

  const handleClearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch (e) {
      console.error("Failed to clear search history from localStorage:", e);
    }
  }, []);

  const handleHistoryItemClick = useCallback((term: string) => {
    // Note: SearchBar input won't update automatically as its state is internal.
    // This is acceptable; the search will still be triggered.
    handleSearch(term);
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-indigo-600 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-white tracking-tight">
          English <span className="text-yellow-300">-&gt;</span> Bengali Dictionary
        </h1>
        <p className="text-indigo-100 mt-2 text-lg">Powered by Gemini & Wiki Dictionary Knowledge</p>
      </header>

      <main className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {isLoading && (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="mt-8">
            <ErrorMessage message={error} />
          </div>
        )}

        {!isLoading && !error && translations && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">
              Results for: <span className="text-indigo-600">{searchTerm}</span>
            </h2>
            <TranslationDisplay results={translations} />
          </div>
        )}

        {!isLoading && !error && !translations && !searchTerm && (
           <div className="mt-8 text-center text-slate-500">
            <p className="text-lg">Enter an English word above to find its Bengali translation.</p>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mt-4 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6-2.292m0 0V3.75m0 12.168a8.966 8.966 0 0 1-3.418-.933m3.418.933a8.966 8.966 0 0 0 3.418-.933m-3.418.933V21m0-9.75a8.966 8.966 0 0 1-3.418.933m3.418-.933a8.966 8.966 0 0 0-3.418.933" />
            </svg>
          </div>
        )}
      </main>

      {searchHistory.length > 0 && (
        <SearchHistoryDisplay
          history={searchHistory}
          onItemClick={handleHistoryItemClick}
          onClear={handleClearHistory}
        />
      )}

      <div className="w-full max-w-2xl mt-8">
        <a 
          href="https://connectify.unaux.com/?i=1" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block bg-amber-300 hover:bg-amber-400 text-slate-800 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-center"
          aria-label="Advertisement: Discover Connectify - Your new social networking hub!"
        >
          ✨ Discover Connectify - Your new social networking hub! ✨
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block ml-1 align-middle">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>

      <footer className="mt-8 text-center text-indigo-200 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Dictionary Project. All rights reserved.</p>
        <p>Model: {GEMINI_MODEL_NAME}</p>
      </footer>
    </div>
  );
};

export default App;
