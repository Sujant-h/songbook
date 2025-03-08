
      // Add this to your setupEventListeners function

// Clear Search Button on No Results Message
const clearSearchButton = document.getElementById('clearSearchButton');
if (clearSearchButton) {
  clearSearchButton.addEventListener('click', function() {
    // Clear the search input
    searchInput.value = '';
    
    // Hide the clear button in the search input
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
  });
}


// Get DOM elements
const searchInput = document.getElementById('searchInput');
const clearButton = document.getElementById('clearButton');
const langSelect = document.getElementById('search-lang-select');
const songsList = document.getElementById('songsList');
const songItems = document.querySelectorAll('.song-item');
const noResultsMessage = document.getElementById('noResultsMessage');
const goToTopButton = document.getElementById('goToTopButton');

// State management
const state = {
  // Update clear button visibility based on search input
  updateClearButtonVisibility() {
    if (searchInput.value.length > 0) {
      clearButton.classList.remove('hidden');
    } else {
      clearButton.classList.add('hidden');
    }
  },

  // Save current state to session storage
  saveState() {
    sessionStorage.setItem('scrollPosition', window.pageYOffset);
    sessionStorage.setItem('searchQuery', searchInput.value);
    sessionStorage.setItem('selectedLang', langSelect.value);
    sessionStorage.setItem('returnedFromSong', 'true');
  },

  // Restore state from session storage
  restoreState() {
    const returnedFromSong = sessionStorage.getItem('returnedFromSong');
    if (returnedFromSong) {
      // Restore search query
      const savedQuery = sessionStorage.getItem('searchQuery');
      if (savedQuery) {
        searchInput.value = savedQuery;
        this.updateClearButtonVisibility();
      }
      
      // Restore language selection
      const savedLang = sessionStorage.getItem('selectedLang');
      if (savedLang && savedLang !== langSelect.value) {
        langSelect.value = savedLang;
        updateSongDisplay();
      }
      
      // Apply the filter to show only matching results
      // This must be called after restoring search query and language
      if (savedQuery && savedQuery.trim() !== '') {
        filterSongs();
        
        // Make sure text matches are shown
        setTimeout(() => {
          songItems.forEach(item => {
            const searchTerm = savedQuery.toLowerCase().trim();
            let textField;
            
            // Get the appropriate field based on language
            if (langSelect.value === 'ta') {
              textField = 'text';
            } else if (langSelect.value === 'en') {
              textField = 'textEn';
            } else if (langSelect.value === 'de') {
              textField = 'textDe';
            }
            
            // Check if this item has a text match
            const text = item.dataset[textField] ? 
              item.dataset[textField].toLowerCase() : 
              item.dataset.text.toLowerCase();
            
            // If there's a text match, show the context
            if (text.includes(searchTerm)) {
              const matchContext = item.querySelector('.match-context');
              if (matchContext) {
                const rawText = item.dataset[textField] || item.dataset.text || '';
                const context = findMatchContext(rawText, searchTerm);
                matchContext.innerHTML = highlightMatches(context, searchTerm);
                matchContext.classList.remove('hidden');
              }
            }
          });
        }, 50);
      }
      
      // Restore scroll position
      const savedPosition = sessionStorage.getItem('scrollPosition');
      if (savedPosition) {
        // Use setTimeout to ensure the scroll happens after the DOM is fully updated
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedPosition));
        }, 100);
      }
      
      // Clear session storage
      this.clearState();
    }
  },

  // Clear state from session storage
  clearState() {
    sessionStorage.removeItem('returnedFromSong');
    sessionStorage.removeItem('scrollPosition');
    sessionStorage.removeItem('searchQuery');
    sessionStorage.removeItem('selectedLang');
  }
};

// Function to highlight text matches in a string
function highlightMatches(text, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '' || !text) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-gray-800 dark:bg-yellow-500/60 dark:text-gray-100 px-1 py-0.5 rounded-sm font-medium">$1</mark>');
}

// Function to find the context around a match
function findMatchContext(text, searchTerm, contextLength = 50) {
  if (!searchTerm || searchTerm.trim() === '' || !text) return '';
  
  searchTerm = searchTerm.toLowerCase();
  const index = text.toLowerCase().indexOf(searchTerm);
  
  if (index === -1) return '';
  
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);
  
  // Add ellipsis if we're not showing from the beginning or to the end
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  
  return prefix + text.substring(start, end) + suffix;
}

// Reorder songs to show title matches first, then text matches
function reorderSongsByMatchPriority() {
  const songItemsArray = Array.from(songItems);
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  if (searchTerm === '') return;
  
  // Sort visible songs by match type
  songItemsArray
    .filter(item => !item.classList.contains('hidden'))
    .sort((a, b) => {
      const aBadge = a.querySelector('.match-badge').textContent || '';
      const bBadge = b.querySelector('.match-badge').textContent || '';
      
      // Assign priority: ID = 3, Title = 2, Text = 1, Word matches = 0
      let aPriority = 0;
      let bPriority = 0;
      
      if (aBadge.includes('ID')) aPriority = 3;
      else if (aBadge.includes('Title')) aPriority = 2;
      else if (aBadge === 'Text') aPriority = 1;
      // Word matches get priority 0
      
      if (bBadge.includes('ID')) bPriority = 3;
      else if (bBadge.includes('Title')) bPriority = 2;
      else if (bBadge === 'Text') bPriority = 1;
      // Word matches get priority 0
      
      // If both are word matches (all words match), sort by ID
      if (aPriority === 0 && bPriority === 0) {
        // Sort by song ID as a tiebreaker
        const aId = parseInt(a.dataset.id);
        const bId = parseInt(b.dataset.id);
        
        return aId - bId;
      }
      
      return bPriority - aPriority;
    })
    .forEach(item => {
      songsList.appendChild(item);
    });
}
// Replace the problematic section in the filterSongs function where the error occurs
// In the part where individual words are checked - we need to use searchWords instead of matchingWords

// The problematic section is around line 467 in your code, where you're trying to use matchingWords
// Here's the corrected version of that section:

function filterSongs() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedLang = langSelect.value;
    let visibleCount = 0;
    
    // First, hide all text snippets completely
    document.querySelectorAll('.song-item .relative').forEach(snippet => {
      snippet.classList.add('hidden');
    });
    
    // Reset match badges - hide all of them first and reset classes
    document.querySelectorAll('.match-badge').forEach(badge => {
      badge.classList.add('hidden');
      badge.className = 'match-badge hidden absolute top-0 right-0 z-20 text-xs font-medium px-1.5 py-0.5 rounded-md bg-opacity-90 shadow-sm mt-3 mr-3';
    });
    
    // Perform initial search with the full search term
    songItems.forEach(item => {
      let titleField, textField;
      
      // Select the appropriate fields based on language
      if (selectedLang === 'ta') {
        titleField = 'title';
        textField = 'text';
      } else if (selectedLang === 'en') {
        titleField = 'titleEn';
        textField = 'textEn';
      } else if (selectedLang === 'de') {
        titleField = 'titleDe';
        textField = 'textDe';
      }
      
      // Get the appropriate data for the selected language
      // Fall back to Tamil if translation is missing
      const title = item.dataset[titleField] ? 
        item.dataset[titleField].toLowerCase() : 
        item.dataset.title.toLowerCase();
        
      const text = item.dataset[textField] ? 
        item.dataset[textField].toLowerCase() : 
        item.dataset.text.toLowerCase();
      
      // Get song ID and compare as a string
      const songId = item.dataset.id;
      
      const originalTitle = item.querySelector('.original-title');
      const matchBadge = item.querySelector('.match-badge');
      const matchContext = item.querySelector('.match-context');
      const matchTextEl = matchContext ? matchContext.querySelector('p') : null;
      
      // Separate check for each type of match
      const idHit = searchTerm !== '' && songId.toLowerCase().includes(searchTerm);
      const titleHit = searchTerm !== '' && title.includes(searchTerm);
      const textHit = searchTerm !== '' && text.includes(searchTerm);
  
      // Mark as visible if any hit is found or if no search term
      if (idHit || titleHit || textHit || searchTerm === '') {
        item.classList.remove('hidden');
        visibleCount++;
        
        // Handle search results
        if (searchTerm !== '') {
          if (idHit || titleHit || textHit) {
            // Show and style the match badge appropriately based on match type
            matchBadge.classList.remove('hidden');
            
            // If ID hit, show as an ID match (purple badge)
            if (idHit) {
              matchBadge.style.backgroundColor = '#f3e8ff'; // purple-100
              matchBadge.style.color = '#6b21a8';          // purple-800
              matchBadge.textContent = 'ID';
            }
            // If title hit (but not ID hit), show as a title match (green badge)
            else if (titleHit) {
              matchBadge.style.backgroundColor = '#dcfce7'; // green-100
              matchBadge.style.color = '#166534';          // green-800
              matchBadge.textContent = 'Title';
            } 
            // If only text hit, show as a text match (blue badge)
            else {
              matchBadge.style.backgroundColor = '#dbeafe'; // blue-100
              matchBadge.style.color = '#1e40af';          // blue-800
              matchBadge.textContent = 'Text';
            }
          } else {
            // No matches - ensure badge is hidden
            matchBadge.classList.add('hidden');
          }
          
          // Show match context for text hits
          if (textHit && !idHit && !titleHit && matchTextEl) {
            const rawText = item.dataset[textField] || item.dataset.text || '';
            const context = findMatchContext(rawText, searchTerm);
            matchTextEl.innerHTML = highlightMatches(context, searchTerm);
            matchContext.classList.remove('hidden');
          } else if (matchContext) {
            matchContext.classList.add('hidden');
          }
          
          // Highlight title if there's a title match
          if (titleHit) {
            const rawTitle = item.dataset[titleField] || item.dataset.title || '';
            originalTitle.innerHTML = highlightMatches(rawTitle, searchTerm);
          } 
          // For ID matches, don't modify the title display - just use the original title
          else {
            // Use plain text for title when no match
            originalTitle.textContent = item.dataset[titleField] || item.dataset.title || '';
          }
        } else {
          // When no search term, make sure badges and contexts are hidden
          matchBadge.classList.add('hidden');
          if (matchContext) matchContext.classList.add('hidden');
          
          // Restore original title as plain text
          originalTitle.textContent = item.dataset[titleField] || item.dataset.title || '';
        }
      } else {
        item.classList.add('hidden');
      }
    });
    
    // If no songs are visible and we have a search term with multiple words, try searching for songs that contain ALL individual words
    if (visibleCount === 0 && searchTerm !== '') {
      // Split the search term into individual words
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 1);
      
      // Only proceed if we have multiple words to search
      if (searchWords.length > 0) {
        // Create a status message for the no results panel
        const statusMessageEl = document.createElement('div');
        statusMessageEl.className = 'text-gray-600 dark:text-gray-400 text-sm mt-2';
        statusMessageEl.innerHTML = 'No exact phrase matches found. Showing results containing all words:';
        
        // Add a list of the words we're searching for
        const wordsList = document.createElement('div');
        wordsList.className = 'flex flex-wrap gap-2 mt-2';
        searchWords.forEach(word => {
          const wordBadge = document.createElement('span');
          wordBadge.className = 'px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium';
          wordBadge.textContent = word;
          wordsList.appendChild(wordBadge);
        });
        
        // Check individual words
        songItems.forEach(item => {
          let titleField, textField;
          
          // Select the appropriate fields based on language
          if (selectedLang === 'ta') {
            titleField = 'title';
            textField = 'text';
          } else if (selectedLang === 'en') {
            titleField = 'titleEn';
            textField = 'textEn';
          } else if (selectedLang === 'de') {
            titleField = 'titleDe';
            textField = 'textDe';
          }
          
          // Get text content
          const title = item.dataset[titleField] ? 
            item.dataset[titleField].toLowerCase() : 
            item.dataset.title.toLowerCase();
            
          const text = item.dataset[textField] ? 
            item.dataset[textField].toLowerCase() : 
            item.dataset.text.toLowerCase();
          
          const songId = item.dataset.id;
          
          const originalTitle = item.querySelector('.original-title');
          const matchBadge = item.querySelector('.match-badge');
          const matchContext = item.querySelector('.match-context');
          const matchTextEl = matchContext ? matchContext.querySelector('p') : null;
          
          // Check if ALL individual words match (must be in the text)
          const allWordsMatch = searchWords.every(word => text.includes(word));
          
          if (allWordsMatch) {
            // Mark as visible
            item.classList.remove('hidden');
            visibleCount++;
            
            // Show match badge
            matchBadge.classList.remove('hidden');
            matchBadge.style.backgroundColor = '#dbeafe'; // blue-100
            matchBadge.style.color = '#1e40af';          // blue-800
            matchBadge.textContent = `All ${searchWords.length} words`;
            
            // Find and highlight the first matching word in the text
            if (matchTextEl) {
              let context = '';
              // FIXED: Use searchWords instead of matchingWords
              for (const word of searchWords) {
                if (text.includes(word)) {
                  const rawText = item.dataset[textField] || item.dataset.text || '';
                  context = findMatchContext(rawText, word);
                  if (context) {
                    // Highlight all matching words in the context
                    let highlightedContext = context;
                    // FIXED: Use searchWords instead of matchingWords
                    for (const matchWord of searchWords) {
                      highlightedContext = highlightMatches(highlightedContext, matchWord);
                    }
                    matchTextEl.innerHTML = highlightedContext;
                    matchContext.classList.remove('hidden');
                    break;
                  }
                }
              }
              
              // If no context found in text, try title
              if (!context && title) {
                // FIXED: Use searchWords instead of matchingWords
                for (const word of searchWords) {
                  if (title.includes(word)) {
                    const rawTitle = item.dataset[titleField] || item.dataset.title || '';
                    // Highlight all matching words in the title
                    let highlightedTitle = rawTitle;
                    // FIXED: Use searchWords instead of matchingWords
                    for (const matchWord of searchWords) {
                      highlightedTitle = highlightMatches(highlightedTitle, matchWord);
                    }
                    originalTitle.innerHTML = highlightedTitle;
                    break;
                  }
                }
              }
            }
          }
        });
        
        // If we now have results, modify the no results message
        if (visibleCount > 0) {
          // Clear existing no results message content
          while (noResultsMessage.firstChild) {
            noResultsMessage.removeChild(noResultsMessage.firstChild);
          }
          
          // Create new elements for the modified message
          const icon = document.createElement('svg');
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
          noResultsMessage.appendChild(document.createElement('div')).appendChild(wordsList);
          noResultsMessage.appendChild(document.createElement('div')).appendChild(clearButton);
          
          clearButton.addEventListener('click', function() {
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
          });
          
          // Show the modified message
          noResultsMessage.classList.remove('hidden');
        }
      }
    }
    
    // Show/hide no results message
    noResultsMessage.classList.toggle('hidden', visibleCount > 0);
    
    // Reorder songs to prioritize ID, title, and then text matches
    if (searchTerm !== '' && visibleCount > 0) {
      reorderSongsByMatchPriority();
    }
  }




// Update song display based on selected language
// Update song display based on selected language
function updateSongDisplay() {
  const selectedLang = langSelect.value;
  // Update this line to use the full URL
  const baseUrl = 'https://songs.c-g-m.eu';
  const searchTerm = searchInput.value.trim();
  
  // Always hide text snippets
  document.querySelectorAll('.song-item .relative').forEach(snippet => {
    snippet.classList.add('hidden');
  });
  
  songItems.forEach(item => {
    const originalTitle = item.querySelector('.original-title');
    const translationTitle = item.querySelector('.translation-title');
    const matchContext = item.querySelector('.match-context');
    const link = item.querySelector('a');
    
    const songId = item.dataset.id;
    const originalTitleText = item.dataset.title;
    
    let displayTitle;
    
    // Set the appropriate titles based on language
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
    
    // Update text content (no highlights if not searching)
    if (searchTerm === '') {
      originalTitle.textContent = displayTitle;
      
      // Ensure match context is hidden
      if (matchContext) {
        matchContext.classList.add('hidden');
      }
    }
  });
  
  // When changing language, re-apply any active search filters
  if (searchInput.value.trim() !== '') {
    filterSongs();
  }
}

// Event Listeners
function setupEventListeners() {
  // Search input event
  searchInput.addEventListener('input', function() {
    state.updateClearButtonVisibility();
    filterSongs();
  });
  
// Enhanced clear button click handler with explicit DOM manipulation
clearButton.addEventListener('click', function() {
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
      matchBadge.className = 'match-badge hidden absolute top-1 left-1 z-20 text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-opacity-90 shadow-sm';
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
});

  // Helper function to restore original titles
  function restoreOriginalTitles() {
    const selectedLang = langSelect.value;
    
    songItems.forEach(item => {
      let titleField;
      
      // Select the appropriate field based on language
      if (selectedLang === 'ta') {
        titleField = 'title';
      } else if (selectedLang === 'en') {
        titleField = 'titleEn';
      } else if (selectedLang === 'de') {
        titleField = 'titleDe';
      }
      
      const originalTitle = item.querySelector('.original-title');
      if (originalTitle) {
        // Use the plain text content without any HTML/highlights
        originalTitle.textContent = item.dataset[titleField] || item.dataset.title || '';
      }
    });
  }
  
  // Language change event
  langSelect.addEventListener('change', function() {
    updateSongDisplay();
    
    // Hide all text-related elements when changing language (if not searching)
    if (searchInput.value.trim() === '') {
      document.querySelectorAll('.match-context').forEach(context => {
        context.classList.add('hidden');
      });
      
      document.querySelectorAll('.match-badge').forEach(badge => {
        badge.classList.add('hidden');
      });
      
      document.querySelectorAll('.song-item .relative').forEach(snippet => {
        snippet.classList.add('hidden');
      });
    } else {
      // Reapply search if there's an active search term
      filterSongs();
    }
  });
  
  // Scroll event for "Go to Top" button
  window.addEventListener('scroll', function() {
    goToTopButton.classList.toggle('hidden', window.pageYOffset <= 300);
  });
  
  // Go to Top button click
  goToTopButton.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // Save state when navigating to a song
  document.querySelectorAll('.song-item a').forEach(link => {
    link.addEventListener('click', function(e) {
      state.saveState();
    });
  });
  
  // Back/forward navigation handling
  window.addEventListener('popstate', function() {
    state.updateClearButtonVisibility();
    filterSongs();
  });
}

// Initialize
function init() {
  // Set up all event listeners
  setupEventListeners();
  
  // Initialize song display
  updateSongDisplay();
  
  // Restore state if returning from a song
  state.restoreState();
  
  // Update clear button visibility (handles page reload cases)
  state.updateClearButtonVisibility();
  
  // Make sure no song text is shown on initial load
  document.querySelectorAll('.match-context').forEach(context => {
    context.classList.add('hidden');
  });
  
  // Hide all text snippets at startup
  document.querySelectorAll('.song-item .relative').forEach(snippet => {
    snippet.classList.add('hidden');
  });
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);