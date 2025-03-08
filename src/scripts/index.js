// Get DOM elements once on initialization
const searchInput = document.getElementById('searchInput');
const clearButton = document.getElementById('clearButton');
const langSelect = document.getElementById('search-lang-select');
const songsList = document.getElementById('songsList');
const songItems = document.querySelectorAll('.song-item');
const noResultsMessage = document.getElementById('noResultsMessage');
const goToTopButton = document.getElementById('goToTopButton');
const clearSearchButton = document.getElementById('clearSearchButton');

// Create a debounce function for performance optimization
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Create a fragment for DOM operations to reduce reflows
const fragment = document.createDocumentFragment();

// State management with improved local storage handling
const state = {
  // Update clear button visibility based on search input
  updateClearButtonVisibility() {
    clearButton.classList.toggle('hidden', !searchInput.value.length);
  },

  // Save current state to session storage
  saveState() {
    const stateData = {
      scrollPosition: window.pageYOffset,
      searchQuery: searchInput.value,
      selectedLang: langSelect.value,
      returnedFromSong: 'true'
    };
    
    // Save all state data in one operation
    sessionStorage.setItem('songSearchState', JSON.stringify(stateData));
  },

  // Restore state from session storage
  restoreState() {
    try {
      const stateData = JSON.parse(sessionStorage.getItem('songSearchState'));
      
      if (!stateData || !stateData.returnedFromSong) return;
      
      // Restore search query
      if (stateData.searchQuery) {
        searchInput.value = stateData.searchQuery;
        this.updateClearButtonVisibility();
      }
      
      // Restore language selection
      if (stateData.selectedLang && stateData.selectedLang !== langSelect.value) {
        langSelect.value = stateData.selectedLang;
        updateSongDisplay();
      }
      
      // Apply the filter to show only matching results
      if (stateData.searchQuery && stateData.searchQuery.trim() !== '') {
        filterSongs();
        
        // Show text matches with reduced DOM operations
        if (stateData.searchQuery.trim()) {
          const searchTerm = stateData.searchQuery.toLowerCase().trim();
          const selectedLang = langSelect.value;
          
          // Create a selector for filtering visible items
          const visibleItems = document.querySelectorAll('.song-item:not(.hidden)');
          
          // Process visible items in batches to avoid blocking the main thread
          processBatch(Array.from(visibleItems), searchTerm, selectedLang, 0);
        }
      }
      
      // Restore scroll position after a short delay
      if (stateData.scrollPosition) {
        setTimeout(() => window.scrollTo(0, parseInt(stateData.scrollPosition)), 50);
      }
      
      // Clear session storage
      this.clearState();
    } catch (e) {
      console.error('Error restoring state:', e);
      this.clearState();
    }
  },

  // Clear state from session storage
  clearState() {
    sessionStorage.removeItem('songSearchState');
  }
};

// Process visible items in batches to avoid blocking the UI
function processBatch(items, searchTerm, selectedLang, startIndex) {
  const batchSize = 10;
  const endIndex = Math.min(startIndex + batchSize, items.length);
  
  // Process current batch
  for (let i = startIndex; i < endIndex; i++) {
    const item = items[i];
    const textField = getLanguageField(selectedLang, 'text');
    
    // Check if this item has a text match
    const textContent = item.dataset[textField] || item.dataset.text || '';
    
    if (textContent.toLowerCase().includes(searchTerm)) {
      const matchContext = item.querySelector('.match-context');
      if (matchContext) {
        const context = findMatchContext(textContent, searchTerm);
        matchContext.innerHTML = highlightMatches(context, searchTerm);
        matchContext.classList.remove('hidden');
      }
    }
  }
  
  // Continue with next batch if there are more items
  if (endIndex < items.length) {
    setTimeout(() => processBatch(items, searchTerm, selectedLang, endIndex), 0);
  }
}

// Helper function to get the appropriate field based on language
function getLanguageField(lang, type) {
  if (lang === 'ta') return type;
  return type + lang.charAt(0).toUpperCase() + lang.slice(1);
}

// Function to highlight text matches in a string with regex caching
const regexCache = new Map();
function highlightMatches(text, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '' || !text) return text;
  
  // Use cached regex if available
  let regex = regexCache.get(searchTerm);
  if (!regex) {
    const escapedTerm = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    regex = new RegExp(`(${escapedTerm})`, 'gi');
    regexCache.set(searchTerm, regex);
  }
  
  return text.replace(regex, '<mark class="bg-yellow-200 text-gray-800 dark:bg-yellow-500/60 dark:text-gray-100 px-1 py-0.5 rounded-sm font-medium">$1</mark>');
}

// Function to find the context around a match with improved efficiency
function findMatchContext(text, searchTerm, contextLength = 50) {
  if (!searchTerm || searchTerm.trim() === '' || !text) return '';
  
  searchTerm = searchTerm.toLowerCase();
  const index = text.toLowerCase().indexOf(searchTerm);
  
  if (index === -1) return '';
  
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);
  
  // Add ellipsis if truncated
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  
  return prefix + text.substring(start, end) + suffix;
}

// Reorder songs to show title matches first, then text matches
// Uses DocumentFragment for more efficient DOM manipulation
function reorderSongsByMatchPriority() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  if (searchTerm === '') return;
  
  // Get visible songs
  const visibleSongs = Array.from(songItems).filter(item => !item.classList.contains('hidden'));
  
  // Sort visible songs by match type
  visibleSongs.sort((a, b) => {
    const aBadge = a.querySelector('.match-badge');
    const bBadge = b.querySelector('.match-badge');
    
    const aText = aBadge ? aBadge.textContent || '' : '';
    const bText = bBadge ? bBadge.textContent || '' : '';
    
    // Assign priority: ID = 3, Title = 2, Text = 1, Word matches = 0
    const aPriority = aText.includes('ID') ? 3 : aText.includes('Title') ? 2 : aText === 'Text' ? 1 : 0;
    const bPriority = bText.includes('ID') ? 3 : bText.includes('Title') ? 2 : bText === 'Text' ? 1 : 0;
    
    // If both are word matches (all words match), sort by ID
    if (aPriority === 0 && bPriority === 0) {
      return parseInt(a.dataset.id) - parseInt(b.dataset.id);
    }
    
    return bPriority - aPriority;
  });
  
  // Use DocumentFragment for batch DOM update
  visibleSongs.forEach(item => {
    fragment.appendChild(item);
  });
  
  // Append all at once to minimize DOM reflows
  songsList.appendChild(fragment);
}

// Optimized song filtering function with reduced redundancy
function filterSongs() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedLang = langSelect.value;
  let visibleCount = 0;
  
  // Cache used DOM elements and field names
  const titleField = getLanguageField(selectedLang, 'title');
  const textField = getLanguageField(selectedLang, 'text');
  
  // Batch DOM updates - first hide all text snippets
  document.querySelectorAll('.song-item .relative').forEach(snippet => {
    snippet.classList.add('hidden');
  });
  
  // Reset match badges - hide all of them first and reset classes
  document.querySelectorAll('.match-badge').forEach(badge => {
    badge.classList.add('hidden');
    badge.className = 'match-badge hidden absolute top-0 right-0 z-20 text-xs font-medium px-1.5 py-0.5 rounded-md bg-opacity-90 shadow-sm mt-3 mr-3';
    badge.style.backgroundColor = '';
    badge.style.color = '';
    badge.textContent = '';
  });
  
  // Perform initial search with the full search term
  songItems.forEach(item => {
    // Get the appropriate data for the selected language
    const title = item.dataset[titleField] || item.dataset.title || '';
    const text = item.dataset[textField] || item.dataset.text || '';
    const songId = item.dataset.id || '';
    
    const originalTitle = item.querySelector('.original-title');
    const matchBadge = item.querySelector('.match-badge');
    const matchContext = item.querySelector('.match-context');
    
    // Skip unnecessary toLowerCase calls if searchTerm is empty
    if (searchTerm === '') {
      item.classList.remove('hidden');
      visibleCount++;
      
      // Restore original title as plain text
      if (originalTitle) {
        originalTitle.textContent = title;
      }
      
      return; // Continue to next item
    }
    
    // Convert to lowercase for comparison
    const titleLower = title.toLowerCase();
    const textLower = text.toLowerCase();
    const songIdLower = songId.toLowerCase();
    
    // Separate check for each type of match
    const idHit = songIdLower.includes(searchTerm);
    const titleHit = titleLower.includes(searchTerm);
    const textHit = textLower.includes(searchTerm);

    // Mark as visible if any hit is found
    if (idHit || titleHit || textHit) {
      item.classList.remove('hidden');
      visibleCount++;
      
      // Update match badge
      if (matchBadge) {
        matchBadge.classList.remove('hidden');
        
        if (idHit) {
          // ID match - purple badge
          matchBadge.style.backgroundColor = '#f3e8ff';
          matchBadge.style.color = '#6b21a8';
          matchBadge.textContent = 'ID';
        } else if (titleHit) {
          // Title match - green badge
          matchBadge.style.backgroundColor = '#dcfce7';
          matchBadge.style.color = '#166534';
          matchBadge.textContent = 'Title';
        } else {
          // Text match - blue badge
          matchBadge.style.backgroundColor = '#dbeafe';
          matchBadge.style.color = '#1e40af';
          matchBadge.textContent = 'Text';
        }
      }
      
      // Show match context for text hits
      if (textHit && !idHit && !titleHit && matchContext) {
        const context = findMatchContext(text, searchTerm);
        const matchTextEl = matchContext.querySelector('p');
        if (matchTextEl) {
          matchTextEl.innerHTML = highlightMatches(context, searchTerm);
        }
        matchContext.classList.remove('hidden');
      }
      
      // Highlight title if there's a title match
      if (originalTitle) {
        if (titleHit) {
          originalTitle.innerHTML = highlightMatches(title, searchTerm);
        } else {
          originalTitle.textContent = title;
        }
      }
    } else {
      item.classList.add('hidden');
    }
  });
  
  // Multi-word search when no exact matches
  if (visibleCount === 0 && searchTerm !== '') {
    handleMultiWordSearch(searchTerm, selectedLang, titleField, textField);
  }
  
  // Toggle no results message visibility
  noResultsMessage.classList.toggle('hidden', visibleCount > 0);
  
  // Reorder search results if there are any
  if (searchTerm !== '' && visibleCount > 0) {
    reorderSongsByMatchPriority();
  }
  
  // Return the total visible items count
  return visibleCount;
}

function handleMultiWordSearch(searchTerm, selectedLang, titleField, textField) {
    // Split the search term into individual words
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 1);
    
    if (searchWords.length === 0) return 0;
    
    let visibleCount = 0;
    
    // Create word badges once for reuse
    const wordsList = document.createElement('div');
    wordsList.className = 'flex flex-wrap gap-2 mt-2';
    
    searchWords.forEach(word => {
      const wordBadge = document.createElement('span');
      wordBadge.className = 'px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium';
      wordBadge.textContent = word;
      wordsList.appendChild(wordBadge);
    });
    
    // Check individual words match
    songItems.forEach(item => {
      // Get text content
      const title = item.dataset[titleField] || item.dataset.title || '';
      const text = item.dataset[textField] || item.dataset.text || '';
      
      const originalTitle = item.querySelector('.original-title');
      const matchBadge = item.querySelector('.match-badge');
      const matchContext = item.querySelector('.match-context');
      
      // Convert to lowercase for comparison
      const titleLower = title.toLowerCase();
      const textLower = text.toLowerCase();
      
      // Check if ALL individual words match
      const allWordsMatch = searchWords.every(word => textLower.includes(word.toLowerCase()));
      
      if (allWordsMatch) {
        // Mark as visible
        item.classList.remove('hidden');
        visibleCount++;
        
        // Show match badge
        if (matchBadge) {
          matchBadge.classList.remove('hidden');
          matchBadge.style.backgroundColor = '#dbeafe';
          matchBadge.style.color = '#1e40af';
          matchBadge.textContent = `All ${searchWords.length} words`;
        }
        
        // Find and highlight the first matching word in the text
        if (matchContext) {
          const matchTextEl = matchContext.querySelector('p');
          if (matchTextEl) {
            // Find first matching word to use for context
            for (const word of searchWords) {
              if (textLower.includes(word.toLowerCase())) {
                let context = findMatchContext(text, word);
                if (context) {
                  // Highlight all matching words in the context
                  let highlightedContext = context;
                  for (const matchWord of searchWords) {
                    highlightedContext = highlightMatches(highlightedContext, matchWord);
                  }
                  matchTextEl.innerHTML = highlightedContext;
                  matchContext.classList.remove('hidden');
                  break;
                }
              }
            }
          }
        }
        
        // Highlight title if any word matches in title
        if (originalTitle) {
          let titleHasMatch = false;
          let highlightedTitle = title;
          
          for (const word of searchWords) {
            if (titleLower.includes(word.toLowerCase())) {
              titleHasMatch = true;
              highlightedTitle = highlightMatches(highlightedTitle, word);
            }
          }
          
          if (titleHasMatch) {
            originalTitle.innerHTML = highlightedTitle;
          } else {
            originalTitle.textContent = title;
          }
        }
      }
    });
    
    // Update no results message if we now have results
    if (visibleCount > 0) {
      updateNoResultsMessage(visibleCount, wordsList);
    }
    
    return visibleCount;
  }

// Update no results message with multi-word search information
function updateNoResultsMessage(visibleCount, wordsList) {
    // Clear existing content
    noResultsMessage.innerHTML = '';
    
    // Create new elements
    const icon = document.createElement('div');
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-yellow-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';
    
    const title = document.createElement('h3');
    title.className = 'text-base font-medium text-gray-700 dark:text-gray-300 mb-1';
    title.textContent = 'No exact phrase matches found';
    
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-500 dark:text-gray-400 text-sm mb-3';
    subtitle.textContent = `Showing ${visibleCount} results containing all search words`;
    
    // Add button for clear search
    const clearButton = document.createElement('button');
    clearButton.id = 'clearPartialSearchButton';
    clearButton.className = 'inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 border border-indigo-200 dark:border-indigo-700 rounded-lg text-indigo-700 dark:text-indigo-300 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600';
    clearButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>Clear Search';
    
    // Add elements to the no results message
    noResultsMessage.appendChild(icon);
    noResultsMessage.appendChild(title);
    noResultsMessage.appendChild(subtitle);
    
    const wordsListContainer = document.createElement('div');
    wordsListContainer.appendChild(wordsList.cloneNode(true));
    noResultsMessage.appendChild(wordsListContainer);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mt-3';
    buttonContainer.appendChild(clearButton);
    noResultsMessage.appendChild(buttonContainer);
    
    // FIX: Use the resetSongs function instead of just clearing input and calling filterSongs
    // This ensures all songs are properly reset and displayed
    clearButton.addEventListener('click', function() {
      resetSongs(); // Call the same function as the main clear button
    });
    
    // Show the modified message
    noResultsMessage.classList.remove('hidden');
  }

// Update song display based on selected language
function updateSongDisplay() {
  const selectedLang = langSelect.value;
  const baseUrl = 'https://songs.c-g-m.eu';
  
  // Batch update for optimization - hide all text snippets at once
  document.querySelectorAll('.song-item .relative').forEach(snippet => {
    snippet.classList.add('hidden');
  });
  
  songItems.forEach(item => {
    const originalTitle = item.querySelector('.original-title');
    const translationTitle = item.querySelector('.translation-title');
    const link = item.querySelector('a');
    
    const songId = item.dataset.id;
    const originalTitleText = item.dataset.title;
    
    // Determine display title based on language
    let displayTitle;
    
    if (selectedLang === 'ta') {
      displayTitle = originalTitleText;
      translationTitle.classList.add('hidden');
      link.href = `${baseUrl}/songs/ta/${songId}`;
    } else if (selectedLang === 'en') {
      displayTitle = item.dataset.titleEn || originalTitleText;
      
      if (item.dataset.title && displayTitle !== originalTitleText) {
        translationTitle.textContent = ` ${originalTitleText}`;
        translationTitle.classList.remove('hidden');
      } else {
        translationTitle.classList.add('hidden');
      }
      
      link.href = `${baseUrl}/songs/en/${songId}`;
    } else if (selectedLang === 'de') {
      displayTitle = item.dataset.titleDe || originalTitleText;
      
      if (item.dataset.title && displayTitle !== originalTitleText) {
        translationTitle.textContent = `${originalTitleText}`;
        translationTitle.classList.remove('hidden');
      } else {
        translationTitle.classList.add('hidden');
      }
      
      link.href = `${baseUrl}/songs/de/${songId}`;
    }
    
    // Update original title text content
    if (originalTitle) {
      originalTitle.textContent = displayTitle;
    }
  });
  
  // Re-apply any active search filters
  if (searchInput.value.trim() !== '') {
    filterSongs();
  }
}

// Reset songs to original state - This function completely resets the search state
function resetSongs() {
    // Clear the search input
    searchInput.value = '';
    
    // Hide the clear button
    clearButton.classList.add('hidden');
    
    // IMPORTANT: First, explicitly make ALL songs visible
    songItems.forEach(item => {
      item.classList.remove('hidden');
      
      // Reset any DOM modifications that might have occurred during search
      
      // 1. Reset match context elements 
      const matchContext = item.querySelector('.match-context');
      if (matchContext) {
        matchContext.classList.add('hidden');
        const matchTextEl = matchContext.querySelector('p');
        if (matchTextEl) {
          matchTextEl.textContent = ''; // Clear any highlighted text
        }
      }
      
      // 2. Reset match badge (both class and inline styles)
      const matchBadge = item.querySelector('.match-badge');
      if (matchBadge) {
        matchBadge.classList.add('hidden');
        matchBadge.className = 'match-badge hidden absolute top-0 right-0 z-20 text-xs font-medium px-1.5 py-0.5 rounded-md bg-opacity-90 shadow-sm mt-3 mr-3';
        // Also reset any inline styles
        matchBadge.style.backgroundColor = '';
        matchBadge.style.color = '';
        matchBadge.textContent = '';
      }
      
      // 3. Reset text snippets
      const textSnippet = item.querySelector('.relative');
      if (textSnippet) {
        textSnippet.classList.add('hidden');
        const snippetText = textSnippet.querySelector('.text-snippet');
        if (snippetText) {
          snippetText.textContent = '';
        }
      }
      
      // 4. Restore original title without highlights
      const originalTitle = item.querySelector('.original-title');
      if (originalTitle) {
        // Get the current language selection
        const selectedLang = langSelect.value;
        let titleField;
        
        if (selectedLang === 'ta') {
          titleField = 'title';
        } else if (selectedLang === 'en') {
          titleField = 'titleEn';
        } else if (selectedLang === 'de') {
          titleField = 'titleDe';
        }
        
        // Explicitly set textContent to remove any HTML/highlights
        const titleText = item.dataset[titleField] || item.dataset.title || '';
        originalTitle.textContent = titleText;
      }
    });
    
    // Hide the no results message
    noResultsMessage.classList.add('hidden');
    
    // Reset the order of songs to their original order
    // This is important as search might have reordered them
    const songItemsArray = Array.from(songItems);
    songItemsArray.sort((a, b) => {
      return parseInt(a.dataset.index) - parseInt(b.dataset.index);
    }).forEach(item => {
      songsList.appendChild(item);
    });
    
    // Ensure the view is updated by triggering a window resize event
    // This can help refresh the layout in some browsers
    window.dispatchEvent(new Event('resize'));
    
    // Focus back on the search input
    searchInput.focus();
  }

// Set up event listeners with improved performance
function setupEventListeners() {
    // Search input event
    searchInput.addEventListener('input', function() {
      state.updateClearButtonVisibility();
      filterSongs();
    });
    
    // Main clear button click handler
    clearButton.addEventListener('click', resetSongs);
    
    // Clear Search Button on No Results Message
    if (clearSearchButton) {
      clearSearchButton.addEventListener('click', resetSongs);
    }
  
  // Language change
  langSelect.addEventListener('change', () => {
    updateSongDisplay();
    
    // Hide all text-related elements when changing language (if not searching)
    if (searchInput.value.trim() === '') {
      const elementsToHide = [
        ...document.querySelectorAll('.match-context'),
        ...document.querySelectorAll('.match-badge'),
        ...document.querySelectorAll('.song-item .relative')
      ];
      
      elementsToHide.forEach(el => el.classList.add('hidden'));
    } else {
      // Reapply search
      filterSongs();
    }
  });
  
  // Go to Top button visibility is managed with Intersection Observer
  const goToTopObserver = new IntersectionObserver(
    (entries) => {
      // Show the button when we've scrolled down (header is not visible)
      goToTopButton.classList.toggle('hidden', entries[0].isIntersecting);
    },
    { threshold: 0 }
  );
  
  // Observe the top of the page
  const header = document.querySelector('header') || document.getElementById('header');
  if (header) {
    goToTopObserver.observe(header);
  } else {
    // Fallback to regular scroll event if no header
    window.addEventListener('scroll', () => {
      goToTopButton.classList.toggle('hidden', window.pageYOffset <= 300);
    });
  }
  
  // Go to Top button click with smooth scrolling
  goToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // Save state when navigating to a song
  document.querySelectorAll('.song-item a').forEach(link => {
    link.addEventListener('click', () => state.saveState());
  });
  
  // Handle browser back/forward navigation
  window.addEventListener('popstate', () => {
    state.updateClearButtonVisibility();
    filterSongs();
  });
}

// Initialize the application
function init() {
  // Set up event listeners
  setupEventListeners();
  
  // Initialize song display
  updateSongDisplay();
  
  // Restore state if returning from a song
  state.restoreState();
  
  // Update clear button visibility
  state.updateClearButtonVisibility();
  
  // Hide all match contexts and text snippets at startup
  const elementsToHide = [
    ...document.querySelectorAll('.match-context'),
    ...document.querySelectorAll('.song-item .relative')
  ];
  
  elementsToHide.forEach(el => el.classList.add('hidden'));
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);