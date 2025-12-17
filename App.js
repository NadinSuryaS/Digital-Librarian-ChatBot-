import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import BookCard from './components/BookCard';
import ChatInterface from './components/ChatInterface';
import Features from './components/Features';
import ReadingList from './components/ReadingList';
import Favorites from './components/Favorites';
import ReadingStats from './components/ReadingStats';
import BookComparison from './components/BookComparison';
import geminiService from './services/geminiService';
import bookApiService from './services/bookApiService';

function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [readingList, setReadingList] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [readBooks, setReadBooks] = useState([]);

  useEffect(() => {
    // Load saved data from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    const savedReadingList = localStorage.getItem('readingList');
    const savedHistory = localStorage.getItem('searchHistory');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedReadBooks = localStorage.getItem('readBooks');
    
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedReadingList) setReadingList(JSON.parse(savedReadingList));
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
    if (savedReadBooks) setReadBooks(JSON.parse(savedReadBooks));
    
    // Apply dark mode to body
    document.body.classList.toggle('light-mode', !darkMode);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('readingList', JSON.stringify(readingList));
  }, [readingList]);

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('readBooks', JSON.stringify(readBooks));
  }, [readBooks]);

  const handleSearch = async (query, type = 'search') => {
    setLoading(true);
    try {
      let booksWithImages = [];

      // Handle different search types
      if (type === 'genre') {
        // For genre buttons, try Google Books API first with subject search
        booksWithImages = await bookApiService.getBooksByGenre(query);
        if (!booksWithImages || booksWithImages.length === 0) {
          // Fallback to AI genre exploration
          const response = await geminiService.getGenreExploration(query);
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsedBooks = JSON.parse(jsonMatch[0]);
            setBooks(parsedBooks);
            setLoading(false);
            return;
          }
        }
      } else if (type === 'recommendations') {
        // For recommendations, use AI service
        const response = await geminiService.getBookRecommendations(query);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedBooks = JSON.parse(jsonMatch[0]);
          setBooks(parsedBooks);
          setLoading(false);
          return;
        }
      } else {
        // For regular search, try Google Books API first
        booksWithImages = await bookApiService.searchBooksWithImages(query);
        if (!booksWithImages || booksWithImages.length === 0) {
          // Fallback to AI search
          const response = await geminiService.searchBooks(query);
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsedBooks = JSON.parse(jsonMatch[0]);
            setBooks(parsedBooks);
            setLoading(false);
            return;
          }
        }
      }

      // If we have books from Google Books API, use them
      if (booksWithImages && booksWithImages.length > 0) {
        setBooks(booksWithImages);
        if (type === 'search') {
          addToHistory(query);
        }
      } else {
        // Final fallback
        setBooks([{
          title: 'No Results Found',
          author: 'Try a different search',
          description: `We couldn't find books for "${query}". Try searching with different keywords or check your spelling.`,
          genre: 'Information',
          rating: 0
        }]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setBooks([{
        title: 'Search Error',
        author: 'Please try again',
        description: 'There was an error processing your search. Please try again in a moment.',
        genre: 'Error',
        rating: 0
      }]);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (query) => {
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
  };

  const toggleFavorite = (book) => {
    const isFavorite = favorites.some(fav => fav.title === book.title);
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.title !== book.title));
    } else {
      setFavorites([...favorites, book]);
    }
  };

  const addToReadingList = (book) => {
    const isInList = readingList.some(item => item.title === book.title);
    if (!isInList) {
      setReadingList([...readingList, { ...book, addedDate: new Date().toISOString() }]);
    }
  };

  const removeFromReadingList = (bookTitle) => {
    setReadingList(readingList.filter(item => item.title !== bookTitle));
  };

  const isFavorite = (book) => {
    return favorites.some(fav => fav.title === book.title);
  };

  const markAsRead = (book) => {
    const isRead = readBooks.some(rb => rb.title === book.title);
    if (!isRead) {
      setReadBooks([...readBooks, { ...book, completedDate: new Date().toISOString() }]);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        favorites={favorites}
        readingList={readingList}
      />
      
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Hero darkMode={darkMode} />
              <SearchBar onSearch={handleSearch} searchHistory={searchHistory} darkMode={darkMode} />
              <Features onFeatureClick={handleSearch} darkMode={darkMode} />
              
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-xl p-6 animate-shimmer h-64"></div>
                  ))}
                </div>
              )}

              {!loading && books.length > 0 && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {books.map((book, index) => (
                    <BookCard
                      key={index}
                      book={book}
                      onFavorite={toggleFavorite}
                      onAddToList={addToReadingList}
                      onMarkAsRead={markAsRead}
                      isFavorite={isFavorite(book)}
                      darkMode={darkMode}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Favorites 
                favorites={favorites} 
                onRemove={toggleFavorite}
                onAddToList={addToReadingList}
                darkMode={darkMode}
              />
            </motion.div>
          )}

          {activeTab === 'reading-list' && (
            <motion.div
              key="reading-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ReadingList 
                readingList={readingList}
                onRemove={removeFromReadingList}
                onFavorite={toggleFavorite}
                onMarkAsRead={markAsRead}
                isFavorite={isFavorite}
                darkMode={darkMode}
              />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ReadingStats 
                favorites={favorites}
                readingList={readingList}
                readBooks={readBooks}
                searchHistory={searchHistory}
                darkMode={darkMode}
              />
            </motion.div>
          )}

          {activeTab === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BookComparison darkMode={darkMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Chat Button */}
      <motion.button
        className="fixed bottom-8 right-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowChat(!showChat)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {showChat && (
          <ChatInterface onClose={() => setShowChat(false)} darkMode={darkMode} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
