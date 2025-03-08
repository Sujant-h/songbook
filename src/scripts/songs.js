document.addEventListener('DOMContentLoaded', function() {
    // Find the audio player section
    const audioSection = document.querySelector('.audio-player-section');
    
    // If no audio section is found, exit early
    if (!audioSection) return;
    
    // Get audio element and custom controls
    const audioElement = document.getElementById('audio-element');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const muteBtn = document.getElementById('mute-btn');
    const seekSlider = document.getElementById('seek-slider');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const progressBar = document.getElementById('progress-bar');
    const volumeLevel = document.getElementById('volume-level');
    const playbackSpeed = document.getElementById('playback-speed');
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    const loadingIcon = document.querySelector('.loading-icon');
    const errorIcon = document.querySelector('.error-icon');
    const volumeIcon = document.querySelector('.volume-icon');
    const muteIcon = document.querySelector('.mute-icon');
    const downloadBtn = document.getElementById('audio-download-btn');
    const audioStatus = document.getElementById('audio-status');
    
    // Audio player state
    let audioLoaded = false;
    let isPlaying = false;
    let audioFileExists = true; // Flag to track if the audio file exists
    
    // Always show the audio section
    audioSection.style.display = 'block';
    
    // First, remove any existing visualizations to prevent duplicates
    const existingVisualizers = document.querySelectorAll('.audio-visualization-container');
    existingVisualizers.forEach(el => el.remove());
    
    // Remove any existing visualization bars
    const existingBars = document.querySelectorAll('.visualization-bar');
    existingBars.forEach(el => el.remove());
    
    // Create and append visualization container
    let visualizationContainer = null;
    const playerContainer = document.querySelector('.bg-gradient-to-r.from-indigo-50');
    if (playerContainer) {
      visualizationContainer = document.createElement('div');
      visualizationContainer.className = 'audio-visualization-container absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden';
      visualizationContainer.style.zIndex = '1';
      visualizationContainer.style.height = '40%'; // Reduced height to avoid overlap
      playerContainer.style.position = 'relative';
      playerContainer.appendChild(visualizationContainer);
      
      // Add CSS for visualization
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .audio-visualization-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 0 8px;
          opacity: 0.2;
        }
        .visualization-bar {
          background-color: rgb(99, 102, 241);
          transition: height 0.05s ease-out;
          border-radius: 1px;
          margin: 0 1px;
          width: 3px;
        }
        .dark .visualization-bar {
          background-color: rgb(165, 180, 252);
        }
        @media (max-width: 640px) {
          .visualization-bar {
            width: 2px;
            margin: 0;
          }
        }
      `;
      document.head.appendChild(styleElement);
      
      // Create visualization bars - more bars for a denser effect
      const numberOfBars = 80; 
      for (let i = 0; i < numberOfBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualization-bar';
        bar.style.height = '0%';
        visualizationContainer.appendChild(bar);
      }
    }
    
    // Get all visualization bars
    const visualizationBars = document.querySelectorAll('.visualization-bar');
    
    // Function to show status message
    function showStatus(message, isError = false) {
      if (audioStatus) {
        audioStatus.textContent = message;
        audioStatus.classList.remove('hidden');
        audioStatus.classList.toggle('bg-red-100', isError);
        audioStatus.classList.toggle('text-red-600', isError);
        audioStatus.classList.toggle('bg-indigo-100', !isError);
        audioStatus.classList.toggle('text-indigo-600', !isError);
        
        // Hide after a delay unless it's an error
        if (!isError) {
          setTimeout(() => {
            audioStatus.classList.add('hidden');
          }, 3000);
        }
      }
    }
    
    // Check if audio element exists
    if (!audioElement) {
      showStatus('Audio element not found', true);
      return;
    }
    
    // Check if audio source exists
    const audioSource = audioElement.querySelector('source');
    if (!audioSource || !audioSource.src) {
      showStatus('Audio source not defined', true);
      return;
    }
    
    const audioUrl = audioSource.src;
    
    // Update UI Icons based on state
    function updatePlayerIcons(state) {
      // Hide all icons first
      playIcon.classList.add('hidden');
      pauseIcon.classList.add('hidden');
      if (loadingIcon) loadingIcon.classList.add('hidden');
      if (errorIcon) errorIcon.classList.add('hidden');
      
      // Show the appropriate icon
      switch (state) {
        case 'loading':
          if (loadingIcon && audioFileExists) loadingIcon.classList.remove('hidden');
          else if (errorIcon) errorIcon.classList.remove('hidden');
          else playIcon.classList.remove('hidden');
          break;
        case 'playing':
          pauseIcon.classList.remove('hidden');
          break;
        case 'paused':
          playIcon.classList.remove('hidden');
          break;
        case 'error':
          if (errorIcon) errorIcon.classList.remove('hidden');
          else playIcon.classList.remove('hidden');
          break;
        default:
          playIcon.classList.remove('hidden');
      }
    }
    
    // Format time in minutes and seconds with error handling
    function formatTime(seconds) {
      if (isNaN(seconds) || seconds === Infinity || seconds < 0) return "0:00";
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    // Update all UI elements based on current audio state
    function updateUI() {
      try {
        // Update time displays with error checking
        if (!isNaN(audioElement.duration) && isFinite(audioElement.duration)) {
          currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
          durationDisplay.textContent = formatTime(audioElement.duration);
          
          // Update progress bar
          const progress = (audioElement.currentTime / audioElement.duration) * 100;
          progressBar.style.width = `${progress}%`;
          seekSlider.value = progress;
        } else {
          // Handle initial state or invalid duration
          currentTimeDisplay.textContent = "0:00";
          durationDisplay.textContent = "0:00";
          progressBar.style.width = "0%";
          seekSlider.value = 0;
        }
        
        // Update play/pause button based on actual playing state
        if (audioElement.paused) {
          isPlaying = false;
          // Special handling for missing audio files
          if (!audioFileExists && errorIcon) {
            updatePlayerIcons('error');
          } else {
            updatePlayerIcons('paused');
          }
          stopVisualization();
        } else {
          isPlaying = true;
          updatePlayerIcons('playing');
          startVisualization();
        }
        
        // Update volume UI
        volumeLevel.style.width = `${audioElement.volume * 100}%`;
        volumeSlider.value = audioElement.volume * 100;
        
        // Update mute button
        if (audioElement.muted) {
          volumeIcon.classList.add('hidden');
          muteIcon.classList.remove('hidden');
        } else {
          volumeIcon.classList.remove('hidden');
          muteIcon.classList.add('hidden');
        }
      } catch (err) {
        console.error('Error updating UI:', err);
      }
    }
    
    // Improved classic audio visualization
    let visualizationInterval;
    const barValues = new Array(visualizationBars.length).fill(0);
    
    function startVisualization() {
      if (visualizationInterval) clearInterval(visualizationInterval);
      
      // Use a pattern of bar heights that resembles a classic equalizer
      // Create different patterns and cycle between them
      const patterns = [
        // Center peak
        (index, total) => {
          const center = total / 2;
          const distance = Math.abs(index - center);
          const maxDistance = total / 2;
          return Math.max(5, 80 - (distance / maxDistance * 75)); // Reduced max height
        },
        // Dual peaks
        (index, total) => {
          const firstPeak = total / 3;
          const secondPeak = (total * 2) / 3;
          const distance = Math.min(Math.abs(index - firstPeak), Math.abs(index - secondPeak));
          const maxDistance = total / 6;
          return Math.max(10, 75 - (distance / maxDistance * 65)); // Reduced max height
        },
        // Triple peaks
        (index, total) => {
          const firstPeak = total / 4;
          const secondPeak = total / 2;
          const thirdPeak = (total * 3) / 4;
          const distance = Math.min(
            Math.abs(index - firstPeak),
            Math.abs(index - secondPeak),
            Math.abs(index - thirdPeak)
          );
          const maxDistance = total / 8;
          return Math.max(5, 70 - (distance / maxDistance * 65)); // Reduced max height
        },
        // Random with smoothing
        (index, total) => {
          return Math.random() * 60 + 5; // Reduced max height
        }
      ];
      
      // Use a mix of patterns and smoothly transition between them
      let currentPatternIndex = 0;
      const total = visualizationBars.length;
      
      // Smoothing factor for transitions
      const smoothing = 0.3;
      
      // Continuous animation with pattern changes
      visualizationInterval = setInterval(() => {
        // Choose pattern and occasionally switch
        if (Math.random() < 0.02) { // 2% chance to change pattern
          currentPatternIndex = (currentPatternIndex + 1) % patterns.length;
        }
        
        // Apply the current pattern with randomness and smooth transitions
        visualizationBars.forEach((bar, index) => {
          const patternValue = patterns[currentPatternIndex](index, total);
          
          // Add randomness based on position (more in the middle, less at edges)
          const randomFactor = Math.random() * 15 - 7.5; // -7.5 to +7.5 (reduced randomness)
          
          // Target height with randomness, clamped to a reasonable range
          const targetHeight = Math.max(2, Math.min(80, patternValue + randomFactor)); // Reduced max height
          
          // Smooth transition to new height
          barValues[index] = barValues[index] * (1 - smoothing) + targetHeight * smoothing;
          
          // Apply height
          bar.style.height = `${barValues[index]}%`;
        });
      }, 80); // Update frequently for smooth animation
    }
    
    function stopVisualization() {
      if (visualizationInterval) {
        clearInterval(visualizationInterval);
        visualizationInterval = null;
      }
      
      // Gradually reduce heights for a fadeout effect
      let reduction = 1.0;
      const fadeInterval = setInterval(() => {
        reduction *= 0.85; // Reduce by 15% each step
        
        visualizationBars.forEach((bar, index) => {
          barValues[index] *= reduction;
          bar.style.height = `${barValues[index]}%`;
        });
        
        if (reduction < 0.01) {
          clearInterval(fadeInterval);
          // Reset all bars to zero
          visualizationBars.forEach((bar, index) => {
            barValues[index] = 0;
            bar.style.height = '0%';
          });
        }
      }, 50);
    }
    
    // Play function with robust error handling
    function playAudio() {
      if (!audioElement) return;
      
      // If we already know the file doesn't exist, don't attempt to play
      if (!audioFileExists) {
        showStatus('Audio file not available', true);
        updatePlayerIcons('error');
        return;
      }
      
      // Don't attempt to play if already playing
      if (!audioElement.paused) return;
      
      if (!audioLoaded) {
        showStatus('Loading audio...');
      }
      
      // Show loading state
      updatePlayerIcons('loading');
      
      // Attempt to play with complete error handling
      const playPromise = audioElement.play();
      
      // Modern browsers return a promise from play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
            audioLoaded = true;
            updatePlayerIcons('playing');
            showStatus('Playing');
            isPlaying = true;
          })
          .catch(error => {
            console.error('Play failed:', error);
            handlePlaybackError(error);
          });
      } else {
        // Fallback for older browsers
        if (audioElement.error) {
          handlePlaybackError(audioElement.error);
        } else {
          updatePlayerIcons('playing');
          isPlaying = true;
        }
      }
    }
    
    // Handle various playback errors
    function handlePlaybackError(error) {
      console.error('Audio playback error:', error);
      
      let errorMessage = 'Unable to play audio';
      
      // Show appropriate error message based on the error
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Playback not allowed. User interaction required.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Audio format not supported by your browser.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Playback aborted.';
      } else if (error.name === 'NetworkError' || error.code === 2) {
        errorMessage = 'Audio file not available.';
        audioFileExists = false; // Mark as not existing on network error
      } else if (error.code === 3) {
        errorMessage = 'Audio decoding failed.';
      } else if (error.code === 4) {
        errorMessage = 'Audio file not available.';
        audioFileExists = false; // Mark as not existing on file not found
      }
      
      showStatus(errorMessage, true);
      updatePlayerIcons('error');
      isPlaying = false;
    }
    
    // Pause audio with error handling
    function pauseAudio() {
      try {
        audioElement.pause();
        isPlaying = false;
        updatePlayerIcons('paused');
        showStatus('Paused');
      } catch (err) {
        console.error('Error pausing audio:', err);
      }
    }
    
    // Toggle play/pause with proper state handling
    function togglePlayPause() {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
      updateUI();
    }
    
    // Initialize the audio player with robust loading
    function initializeAudioPlayer() {
      // Check if audio is available
      if (audioElement.readyState >= 2) {  // HAVE_CURRENT_DATA or higher
        audioLoaded = true;
        updateUI();
        showStatus('Audio ready');
      }
      
      // Set initial volume
      try {
        audioElement.volume = 1.0;
        volumeSlider.value = 100;
        volumeLevel.style.width = '100%';
      } catch (err) {
        console.error('Error setting initial volume:', err);
      }
      
      // Ensure playback rate is set correctly
      try {
        audioElement.playbackRate = 1.0;
        playbackSpeed.value = "1";
      } catch (err) {
        console.error('Error setting playback rate:', err);
      }
    }
    
    // EVENT LISTENERS - With error handling for all events
    
    // Play/Pause button
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        togglePlayPause();
      });
    }
    
    // Mute button
    if (muteBtn) {
      muteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        try {
          audioElement.muted = !audioElement.muted;
          updateUI();
        } catch (err) {
          console.error('Error toggling mute:', err);
        }
      });
    }
    
    // Seek slider
    if (seekSlider) {
      seekSlider.addEventListener('input', function() {
        try {
          // Don't allow seeking if file doesn't exist
          if (!audioFileExists) return;
          
          const seekTime = (audioElement.duration * seekSlider.value) / 100;
          if (!isNaN(seekTime) && isFinite(seekTime)) {
            audioElement.currentTime = seekTime;
            updateUI();
          }
        } catch (err) {
          console.error('Error seeking:', err);
        }
      });
    }
    
    // Volume slider
    if (volumeSlider) {
      volumeSlider.addEventListener('input', function() {
        try {
          const volume = volumeSlider.value / 100;
          audioElement.volume = volume;
          audioElement.muted = false;
          updateUI();
        } catch (err) {
          console.error('Error adjusting volume:', err);
        }
      });
    }
    
    // Playback speed
    if (playbackSpeed) {
      playbackSpeed.addEventListener('change', function() {
        try {
          // Don't allow speed change if file doesn't exist
          if (!audioFileExists) return;
          
          const speed = parseFloat(playbackSpeed.value);
          if (!isNaN(speed)) {
            audioElement.playbackRate = speed;
          }
        } catch (err) {
          console.error('Error changing playback speed:', err);
        }
      });
    }
    
    // AUDIO ELEMENT EVENTS
    
    // Update UI when audio time updates
    audioElement.addEventListener('timeupdate', function() {
      updateUI();
    });
    
    // When metadata loaded
    audioElement.addEventListener('loadedmetadata', function() {
      audioLoaded = true;
      updateUI();
      showStatus('Audio metadata loaded');
    });
    
    // When audio can play
    audioElement.addEventListener('canplay', function() {
      audioLoaded = true;
      audioFileExists = true; // File definitely exists if we can play it
      updateUI();
      showStatus('Audio ready to play');
    });
    
    // When audio playback ends
    audioElement.addEventListener('ended', function() {
      isPlaying = false;
      updatePlayerIcons('paused');
      stopVisualization();
      showStatus('Playback ended');
      
      // Reset to beginning
      audioElement.currentTime = 0;
      updateUI();
    });
    
    // Handle errors
    audioElement.addEventListener('error', function(e) {
      const error = audioElement.error;
      if (error && error.code === 4) {
        // Media not found error
        audioFileExists = false;
      }
      handlePlaybackError(error || { message: 'Unknown audio error' });
    });
    
    // Check if audio file is available
    fetch(audioUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          // File exists, initialize the player normally
          audioFileExists = true;
          initializeAudioPlayer();
          
          // Set download link if available
          if (downloadBtn) {
            downloadBtn.classList.remove('hidden');
            const downloadLink = downloadBtn.querySelector('a');
            if (downloadLink) downloadLink.href = audioUrl;
          }
        } else {
          // File not found, mark as not existing
          audioFileExists = false;
          console.log('Audio file not found');
          showStatus('Audio file not available', true);
          updatePlayerIcons('error');
          
          // Still initialize the player with basic UI
          initializeAudioPlayer();
        }
      })
      .catch(error => {
        // Network error or CORS issue
        console.log('Network error checking audio file:', error);
        showStatus('Audio file not available', true);
        updatePlayerIcons('error');
        
        // Still initialize the player with basic UI
        initializeAudioPlayer();
      });
    
    // Initialize the player
    initializeAudioPlayer();
  });
  
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeSharing();
    setupPrintFunctionality();
    setupLanguageSwitching();
    highlightSearchTerm();
    updateSearchParamOnLinks();
  });
  
  // Social media sharing functionality
  function initializeSharing() {
    // Get the song title and ID
    const titleElement = document.querySelector('h1');
    const songTitle = titleElement ? titleElement.textContent.trim() : "Song Title";
    
    // Extract the song ID from the title or data attribute
    let songId = "";
    const songContainer = document.querySelector('[data-song-id]');
    if (songContainer) {
      songId = songContainer.dataset.songId;
    } else if (songTitle.includes(':')) {
      songId = songTitle.split(':')[0].trim();
    }
    
    // Current URL
    const url = window.location.href;
    
    // Create share text
    const shareText = `${songId ? songId + ': ' : ''}${songTitle.replace(/^[^:]+:\s*/, '')} - Tamil Christian Songs`;
    
    // WhatsApp share
    const whatsappBtn = document.getElementById('whatsapp-share');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ': ' + url)}`;
        window.open(whatsappUrl, '_blank');
      });
    }
    
    // Facebook share
    const facebookBtn = document.getElementById('facebook-share');
    if (facebookBtn) {
      facebookBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank');
      });
    }
    
    // Twitter/X share
    const twitterBtn = document.getElementById('twitter-share');
    if (twitterBtn) {
      twitterBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank');
      });
    }
    
    // Telegram share
    const telegramBtn = document.getElementById('telegram-share');
    if (telegramBtn) {
      telegramBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramUrl, '_blank');
      });
    }
    
    // Copy link functionality with updated styling
    const copyLinkBtn = document.getElementById('copy-link');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', function() {
        try {
          // Use modern clipboard API if available
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
              .then(() => showCopiedFeedback(this))
              .catch(err => {
                console.error('Failed to copy:', err);
                fallbackCopyLink(this, url);
              });
          } else {
            fallbackCopyLink(this, url);
          }
        } catch (error) {
          console.error('Copy error:', error);
          fallbackCopyLink(this, url);
        }
      });
    }
  }
  
  // Fallback method for copying link
  function fallbackCopyLink(button, text) {
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    
    // Select and copy the link
    tempInput.select();
    document.execCommand('copy');
    
    // Remove the temporary element
    document.body.removeChild(tempInput);
    
    // Show feedback
    showCopiedFeedback(button);
  }
  
  // Shows "Copied!" feedback on button
  function showCopiedFeedback(button) {
    const originalText = button.innerHTML;
    
    // Updated design for the "Copied!" feedback
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>Copied!</span>
    `;
    
    // Add a temporary success class
    button.classList.add('bg-green-50', 'dark:bg-green-900/20', 'text-green-700', 'dark:text-green-300', 'border-green-200', 'dark:border-green-800');
    
    // Reset button after 2 seconds
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('bg-green-50', 'dark:bg-green-900/20', 'text-green-700', 'dark:text-green-300', 'border-green-200', 'dark:border-green-800');
    }, 2000);
  }
  
  // Enhanced Printing Functionality with Fixed Content Generation
  function setupPrintFunctionality() {
    const printButton = document.getElementById('print-song');
    if (!printButton) return;
    
    printButton.addEventListener('click', function() {
      try {
        // Comprehensive song data extraction with robust fallback mechanisms
        const extractSongData = () => {
          // Title extraction
          const titleElement = document.querySelector('h1');
          const fullTitle = titleElement ? titleElement.textContent.trim() : "Untitled Song";
          
          // Song ID extraction with multiple fallback strategies
          let songId = "";
          const songContainer = document.querySelector('[data-song-id]');
          if (songContainer) {
            songId = songContainer.dataset.songId;
          } else if (fullTitle.includes(':')) {
            songId = fullTitle.split(':')[0].trim();
          }
          
          // Clean title (remove song ID if present)
          const cleanTitle = fullTitle.replace(/^[^:]+:\s*/, '');
          
          // Lyrics extraction
          const firstPre = document.querySelector('pre');
          const songText = firstPre ? firstPre.textContent.trim() : "Lyrics not available";
          
          // Original version extraction
          let originalTitle = "";
          let originalText = "";
          const originalSection = document.querySelector('.mt-8.pt-6');
          if (originalSection) {
            const titleEl = originalSection.querySelector('h4');
            const originalPre = originalSection.querySelector('pre');
            
            originalTitle = titleEl ? titleEl.textContent.trim() : "";
            originalText = originalPre ? originalPre.textContent.trim() : "";
          }
          
          return { songId, fullTitle, cleanTitle, songText, originalTitle, originalText };
        };
        
        // Get song data
        const { songId, fullTitle, cleanTitle, songText, originalTitle, originalText } = extractSongData();
        
        // Create HTML for the new window with balanced styling
        const printHTML = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${cleanTitle} - Print Version</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
              
              :root {
                --primary-color: #1e40af;
                --secondary-color: #4338ca;
                --background-light: #f9fafb;
                --text-dark: #1f2937;
                --border-color: #e5e7eb;
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              @page {
                margin: 0.4in;
                size: letter;
              }
              
              html, body {
                height: 100%;
                margin: 0;
                padding: 0;
              }
              
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                line-height: 1.5;
                color: var(--text-dark);
                max-width: 800px;
                margin: 0 auto;
                padding: 15px;
                background: white;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                font-size: 15px;
              }
              
              .print-container {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
              }
              
              .print-header {
                text-align: center;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--border-color);
                margin-bottom: 15px;
              }
              
              .song-id {
                display: inline-block;
                background-color: #f3f4f6;
                color: var(--primary-color);
                font-weight: bold;
                padding: 3px 10px;
                border-radius: 5px;
                margin-right: 8px;
              }
              
              h1 {
                font-size: 24px;
                margin: 0 0 8px 0;
                color: var(--primary-color);
              }
              
              .song-details {
                margin-bottom: 15px;
                font-size: 12px;
                color: #6b7280;
              }
              
              .lyrics-container {
                background-color: var(--background-light);
                border-radius: 7px;
                padding: 15px;
                margin-bottom: 15px;
                white-space: pre-line;
                border: 1px solid var(--border-color);
              }
              
              .original-title {
                font-weight: 600;
                font-size: 17px;
                margin: 15px 0 8px 0;
                padding-top: 15px;
                border-top: 1px solid var(--border-color);
                color: var(--primary-color);
              }
              
              .footer {
                text-align: center;
                font-size: 11px;
                color: #6b7280;
                margin-top: auto;
                padding-top: 15px;
                border-top: 1px solid var(--border-color);
              }
              
              .copyright {
                text-align: center;
                font-size: 11px;
                color: #6b7280;
                margin-top: 15px;
              }
              
              @media print {
                body {
                  padding: 0;
                }
                
                .print-container {
                  padding: 0.4in;
                }
                
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="print-header">
                <h1>
                  ${songId ? `<span class="song-id">${songId}</span>` : ''}
                  ${cleanTitle}
                </h1>
                <div class="song-details">
                  Tamil Christian Songs | Printed on ${new Date().toLocaleDateString()}
                </div>
              </div>
              
              <div class="lyrics-container">
                ${songText.replace(/\n\n\n+/g, '\n\n')}
              </div>
              
              ${originalTitle && originalText ? `
                <h2 class="original-title">Original Tamil Version: ${originalTitle}</h2>
                <div class="lyrics-container">
                  ${originalText.replace(/\n\n\n+/g, '\n\n')}
                </div>
              ` : ''}
              
              <div class="footer">
                <div class="copyright">
                  © Tamil Christian Songs
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        
        // Open a new window and write the content
        const printWindow = window.open('', 'PrintSong', 'width=800,height=600');
        if (!printWindow) {
          alert("Please allow pop-ups to print this song.");
          return;
        }
        
        // Ensure the window is fully loaded before writing content
        printWindow.document.open();
        printWindow.document.write(printHTML);
        printWindow.document.close();
        
        // Focus the new window
        printWindow.focus();
        
        // Automatically open the print dialog after a short delay to ensure content is rendered
        setTimeout(() => {
          printWindow.print();
          // Don't close the window after printing to allow users to try again if needed
        }, 800);
      } catch (error) {
        console.error("Error in print function:", error);
        alert("Sorry, there was a problem preparing the song for printing. Please try again.");
      }
    });
  }
  
  // Make sure this function runs when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', setupPrintFunctionality);
  
  // Centralized language switching function
  function setupLanguageSwitching() {
    const languageSelect = document.getElementById('language-select');
    if (!languageSelect) return;
    
    languageSelect.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      switchLanguage(selectedLang);
    });
  }
  
  function switchLanguage(selectedLang) {
    // Get the current URL path
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    
    // Try to extract the song ID from the path
    let songId = '';
    
    // Look for the song ID in different possible locations
    if (pathParts.length > 0) {
      // First try: assume it's the last part of the path
      songId = pathParts[pathParts.length - 1];
      
      // Validation: Check if songId is actually a numeric ID
      if (!/^\d+$/.test(songId)) {
        // If not numeric, try another approach: look for patterns in the path
        const songsIndex = pathParts.indexOf('songs');
        if (songsIndex >= 0 && songsIndex + 2 < pathParts.length) {
          // Format should be /songs/{lang}/{id}
          songId = pathParts[songsIndex + 2];
        } else {
          // If we still can't find it, check if the song ID is available in the page content
          const songIdElement = document.querySelector('[data-song-id]');
          if (songIdElement) {
            songId = songIdElement.dataset.songId;
          } else {
            console.error('Could not determine song ID. Redirecting to home page.');
            window.location.href = 'https://songs.c-g-m.eu';
            return;
          }
        }
      }
    }
    
    // Construct the new URL, preserving any query parameters
    const queryString = window.location.search;
    const newUrl = `https://songs.c-g-m.eu/songs/${selectedLang}/${songId}${queryString}`;
    
    // Save language preference
    sessionStorage.setItem('selectedLanguage', selectedLang);
    
    // Navigate to the new URL
    window.location.href = newUrl;
  }
  
  // Enhanced Search Highlighting Function
  
  // Main highlighting function
  function highlightSearchTerm() {
    // Get search query from URL parameters or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || sessionStorage.getItem('searchQuery');
    
    if (!searchQuery || searchQuery.trim() === '') return;
    
    // Split search query into individual words for multi-word matching
    const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 1);
    const isMultiWordSearch = searchWords.length > 1;
    
    // Function to safely highlight text nodes without breaking HTML structure
    function highlightTextNodes(element, searchTerms) {
      if (!element || !searchTerms || (Array.isArray(searchTerms) && searchTerms.length === 0)) return;
      
      // Handle both single term and array of terms
      const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
      
      // Process only element nodes (skip text outside elements)
      if (element.nodeType === Node.ELEMENT_NODE) {
        // Skip certain elements that shouldn't be highlighted
        if (['SCRIPT', 'STYLE', 'MARK', 'CODE', 'BUTTON', 'SELECT', 'OPTION'].includes(element.tagName)) {
          return;
        }
        
        // Process child nodes recursively
        const childNodes = [...element.childNodes]; // Create a copy to avoid live collection issues
        
        childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            // This is a text node, check for matches
            const text = child.textContent;
            let hasMatch = false;
            
            // Check if any term matches
            for (const term of terms) {
              if (term.trim() === '') continue;
              
              const searchRegex = new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
              if (searchRegex.test(text)) {
                hasMatch = true;
                break;
              }
            }
            
            if (hasMatch) {
              // Found a match in text node, replace with highlighted version
              const frag = document.createDocumentFragment();
              
              let processedText = text;
              
              // Apply highlighting for each term
              for (const term of terms) {
                if (term.trim() === '') continue;
                
                const searchRegex = new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
                
                // Create a temporary div to hold the processed HTML
                const tempDiv = document.createElement('div');
                
                // Replace matches with marked spans
                tempDiv.innerHTML = processedText.replace(searchRegex, match => 
                  `<mark class="bg-yellow-300 text-gray-900 dark:bg-yellow-500/60 dark:text-gray-900 px-1 py-0.5 rounded-sm font-medium">${match}</mark>`
                );
                
                // Get the processed HTML result
                processedText = tempDiv.innerHTML;
              }
              
              // Create a temporary container
              const tempContainer = document.createElement('div');
              tempContainer.innerHTML = processedText;
              
              // Append all child nodes to our fragment
              while (tempContainer.firstChild) {
                frag.appendChild(tempContainer.firstChild);
              }
              
              // Replace the original text node with our fragment
              element.replaceChild(frag, child);
            }
          } else {
            // This is an element node, recurse into it
            highlightTextNodes(child, searchTerms);
          }
        });
      }
    }
    
    // Areas to search for the query
    const searchAreas = [
      document.querySelector('h1'), // Song title
      ...document.querySelectorAll('pre') // Song lyrics
    ];
    
    // Perform highlighting - use either full query or individual words based on search type
    let highlightCount = 0;
    
    searchAreas.forEach(element => {
      if (element) {
        // Store the original innerHTML for potential reset
        if (!element.dataset.originalContent) {
          element.dataset.originalContent = element.innerHTML;
        }
        
        // Apply highlighting with either full phrase or individual words
        if (isMultiWordSearch) {
          // Try exact phrase first
          const exactMatches = countMatches(element.textContent, searchQuery);
          
          if (exactMatches > 0) {
            // Found exact phrase matches, highlight those
            highlightTextNodes(element, searchQuery);
            highlightCount += exactMatches;
          } else {
            // No exact phrase match, check for individual words
            highlightTextNodes(element, searchWords);
            
            // Count individual word matches
            searchWords.forEach(word => {
              highlightCount += countMatches(element.textContent, word);
            });
          }
        } else {
          // Single word search
          highlightTextNodes(element, searchQuery);
          highlightCount += countMatches(element.textContent, searchQuery);
        }
      }
    });
    
    // Add a search badge if matches were found
    if (highlightCount > 0) {
      addSearchBadge(searchQuery, highlightCount, isMultiWordSearch);
    }
  }
  
  // Helper function to count matches of a term in text
  function countMatches(text, term) {
    if (!text || !term) return 0;
    
    const regex = new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }
  
  // Function to add the search badge with improved navigation controls
  function addSearchBadge(searchQuery, highlightCount, isMultiWordSearch) {
    // Remove any existing search badge
    const existingBadge = document.getElementById('search-highlight-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    // Create the search badge with improved navigation
    const searchBadge = document.createElement('div');
    searchBadge.id = 'search-highlight-badge';
    searchBadge.className = 'mb-6 flex flex-wrap items-center gap-3 text-sm bg-indigo-50 dark:bg-indigo-900/30 px-4 py-3 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm';
    
    // For multi-word searches, add a proper explanation of what was matched
    let matchTypeText = '';
    if (isMultiWordSearch) {
      const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 1);
      matchTypeText = `<div class="text-gray-600 dark:text-gray-400 text-xs mt-1">
        ${searchWords.length} words being searched: 
        ${searchWords.map(word => `<span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium">${escapeHTML(word)}</span>`).join(' ')}
      </div>`;
    }
    
    searchBadge.innerHTML = `
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="text-gray-800 dark:text-gray-200 font-medium">Showing results for "<span class="font-semibold text-indigo-700 dark:text-indigo-300">${escapeHTML(searchQuery)}</span>"</span>
        </div>
        ${matchTypeText}
      </div>
      
      <div class="flex items-center gap-3">
        <span id="highlightCounter" class="bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 px-2.5 py-1 rounded-md text-sm font-medium min-w-[70px] text-center">
          ${highlightCount} match${highlightCount !== 1 ? 'es' : ''}
        </span>
        
        <div class="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm">
          <button id="prevHighlight" class="flex items-center justify-center h-8 w-8 rounded-l-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 transition-colors" title="Previous match (Shift+F3)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button id="nextHighlight" class="flex items-center justify-center h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 transition-colors" title="Next match (F3)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button id="clearHighlights" class="flex items-center justify-center h-8 w-8 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors" title="Clear highlights (Esc)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    `;
    
    // Insert the badge at the beginning of the main content
    const songContent = document.querySelector('.p-5.sm\\:p-8');
    if (songContent) {
      songContent.insertBefore(searchBadge, songContent.firstChild);
    } else {
      // Fallback - look for any suitable container
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.insertBefore(searchBadge, mainContent.firstChild);
      }
    }
    
    // Set up the highlight navigation system
    setupHighlightNavigation();
  }
  
  // Update the search parameter propagation function
  // Update the search parameter propagation function
  function updateSearchParamOnLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    
    if (searchQuery) {
      // Store in session storage for persistence across pages
      sessionStorage.setItem('searchQuery', searchQuery);
      
      // Also store search terms for multi-word searches
      const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 1);
      if (searchWords.length > 1) {
        sessionStorage.setItem('searchWords', JSON.stringify(searchWords));
      }
      
      // Update language switcher to preserve search parameter
      const languageSelect = document.getElementById('language-select');
      if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
          const selectedLang = e.target.value;
          
          // Get the current URL path components
          const currentPath = window.location.pathname;
          const pathParts = currentPath.split('/');
          
          // Extract song ID - handle different path formats
          let songId = '';
          if (pathParts.length > 0) {
            // Try the last part of the path first
            songId = pathParts[pathParts.length - 1];
            
            // Check if it looks like a song ID
            if (!/^\d+$/.test(songId)) {
              // Try finding it through path pattern
              const songsIndex = pathParts.indexOf('songs');
              if (songsIndex >= 0 && songsIndex + 2 < pathParts.length) {
                songId = pathParts[songsIndex + 2];
              } else {
                // Last resort: check data attribute
                const songElement = document.querySelector('[data-song-id]');
                if (songElement) {
                  songId = songElement.dataset.songId;
                }
              }
            }
          }
          
          if (!songId) {
            console.error('Could not determine song ID');
            return;
          }
          
          // Build the new URL with search parameters preserved
          const newUrl = `https://songs.c-g-m.eu/songs/${selectedLang}/${songId}?q=${encodeURIComponent(searchQuery)}`;
          
          // Navigate to the new URL
          window.location.href = newUrl;
          
          // Prevent default handling
          e.preventDefault();
        });
      }
    }
  }
  
  // Function to set up highlight navigation with improved visibility
  function setupHighlightNavigation() {
    let currentHighlightIndex = -1;
    const highlights = document.querySelectorAll('mark');
    
    // Update the counter text
    function updateCounter() {
      const counter = document.getElementById('highlightCounter');
      if (counter && highlights.length > 0) {
        counter.textContent = `${currentHighlightIndex + 1} of ${highlights.length}`;
      }
    }
    
    // Navigate to a specific highlight with improved visibility
    function navigateToHighlight(index) {
      if (highlights.length === 0) return;
      
      // Remove current active highlight effect from all
      highlights.forEach(h => {
        h.classList.remove('ring', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'ring-offset-white', 'dark:ring-offset-gray-800', 'animate-pulse');
      });
      
      // Update index with wrapping
      currentHighlightIndex = (index + highlights.length) % highlights.length;
      
      // Apply enhanced highlight effect
      const currentHighlight = highlights[currentHighlightIndex];
      currentHighlight.classList.add('ring', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'ring-offset-white', 'dark:ring-offset-gray-800');
      
      // Add a brief pulse animation
      currentHighlight.classList.add('animate-pulse');
      setTimeout(() => {
        currentHighlight.classList.remove('animate-pulse');
      }, 1000);
      
      // Smooth scroll with offset for header and better positioning
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      const elementRect = currentHighlight.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const middle = absoluteElementTop - (window.innerHeight / 3); // Position in the upper third
      
      window.scrollTo({
        top: middle - headerHeight - 20, // Add extra padding
        behavior: 'smooth'
      });
      
      updateCounter();
    }
    
    // Navigate to the next or previous highlight
    function navigateHighlights(direction) {
      navigateToHighlight(currentHighlightIndex + direction);
    }
    
    // Clear all highlights
    function clearHighlights() {
      // Restore original content to elements with highlights
      document.querySelectorAll('[data-original-content]').forEach(element => {
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
      });
      
      // Remove the search badge
      const searchBadge = document.getElementById('search-highlight-badge');
      if (searchBadge) {
        searchBadge.remove();
      }
      
      // Clear the search query parameter
      const url = new URL(window.location);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
      sessionStorage.removeItem('searchQuery');
      sessionStorage.removeItem('searchWords');
    }
    
    // Set up event listeners for the navigation buttons
    document.getElementById('prevHighlight')?.addEventListener('click', () => navigateHighlights(-1));
    document.getElementById('nextHighlight')?.addEventListener('click', () => navigateHighlights(1));
    document.getElementById('clearHighlights')?.addEventListener('click', clearHighlights);
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
        e.preventDefault();
        navigateHighlights(1);
      } else if ((e.shiftKey && e.key === 'F3') || (e.ctrlKey && e.shiftKey && e.key === 'g')) {
        e.preventDefault();
        navigateHighlights(-1);
      } else if (e.key === 'Escape') {
        const clearButton = document.getElementById('clearHighlights');
        if (clearButton) {
          clearButton.click();
        }
      }
    });
    
    // Start by highlighting the first match
    if (highlights.length > 0) {
      navigateToHighlight(0);
    }
  }
  
  // Helper function to safely escape HTML for display
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // Create and add CSS animation styles for highlights
  function addHighlightStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes highlightPulse {
        0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
        70% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
        100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
      }
      
      .highlight-pulse {
        animation: highlightPulse 1.5s ease-out;
      }
      
      mark {
        transition: all 0.2s ease-in-out;
      }
      
      mark.current {
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Initialize everything when document is ready
  document.addEventListener('DOMContentLoaded', () => {
    addHighlightStyles();
    highlightSearchTerm();
    updateSearchParamOnLinks();
  });