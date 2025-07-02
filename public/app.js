document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const audioPlayer = document.getElementById('audio-player');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.querySelector('.progress-bar-container');
  const currentTimeDisplay = document.getElementById('current-time');
  const durationDisplay = document.getElementById('duration');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeIcon = document.getElementById('volume-icon');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const featuredPlaylistsContainer = document.getElementById('featured-playlists');
  const searchResultsContainer = document.getElementById('search-results');
  const nowPlayingTitle = document.getElementById('now-playing-title');
  const nowPlayingArtist = document.getElementById('now-playing-artist');
  const nowPlayingCover = document.getElementById('now-playing-cover');

  // App State
  let currentTrackIndex = 0;
  let tracks = [];
  let isPlaying = false;
  let isDraggingProgress = false;
  let lastVolume = volumeSlider.value;

  // Initialize the app
  init();

  function init() {
    // Set initial volume
    audioPlayer.volume = volumeSlider.value / 100;
    
    // Load featured playlists
    loadFeaturedPlaylists();
    
    // Event listeners
    setupEventListeners();
  }

  function setupEventListeners() {
    // Player controls
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPreviousTrack);
    nextBtn.addEventListener('click', playNextTrack);
    
    // Progress bar
    progressContainer.addEventListener('click', seek);
    progressContainer.addEventListener('mousedown', () => isDraggingProgress = true);
    document.addEventListener('mouseup', () => isDraggingProgress = false);
    document.addEventListener('mousemove', (e) => {
      if (isDraggingProgress) seek(e);
    });
    
    // Audio events
    audioPlayer.addEventListener('timeupdate', updateProgressBar);
    audioPlayer.addEventListener('ended', playNextTrack);
    audioPlayer.addEventListener('loadedmetadata', updateDurationDisplay);
    
    // Volume control
    volumeSlider.addEventListener('input', setVolume);
    volumeIcon.addEventListener('click', toggleMute);
    
    // Search functionality
    searchBtn.addEventListener('click', searchTracks);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') searchTracks();
    });
  }

  // Load featured playlists from Spotify
  async function loadFeaturedPlaylists() {
    try {
      const response = await fetch('/api/featured');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const playlists = await response.json();
      displayFeaturedPlaylists(playlists);
    } catch (error) {
      console.error('Error loading featured playlists:', error);
      featuredPlaylistsContainer.innerHTML = '<p class="error-message">Failed to load playlists. Please try again later.</p>';
    }
  }

  // Display featured playlists
  function displayFeaturedPlaylists(playlists) {
    featuredPlaylistsContainer.innerHTML = '';
    
    if (!playlists || playlists.length === 0) {
      featuredPlaylistsContainer.innerHTML = '<p class="error-message">No playlists found.</p>';
      return;
    }
    
    playlists.forEach(playlist => {
      const playlistCard = document.createElement('div');
      playlistCard.className = 'playlist-card';
      playlistCard.innerHTML = `
        <img src="${playlist.images[0]?.url || 'https://via.placeholder.com/200'}" 
             alt="${playlist.name}" 
             class="playlist-cover"
             onerror="this.src='https://via.placeholder.com/200'">
        <div class="playlist-name">${playlist.name}</div>
        <div class="playlist-description">${playlist.description || 'By Spotify'}</div>
      `;
      playlistCard.addEventListener('click', () => {
        // In a real app, you would fetch tracks for this playlist
        alert(`Playlist "${playlist.name}" selected. In a full app, this would load the playlist tracks.`);
      });
      featuredPlaylistsContainer.appendChild(playlistCard);
    });
  }

  // Search tracks
  async function searchTracks() {
    const query = searchInput.value.trim();
    if (!query) {
      searchResultsContainer.innerHTML = '<p class="error-message">Please enter a search term.</p>';
      return;
    }

    try {
      searchResultsContainer.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const searchResults = await response.json();
      tracks = searchResults;
      displaySearchResults(tracks);
    } catch (error) {
      console.error('Error searching tracks:', error);
      searchResultsContainer.innerHTML = '<p class="error-message">Failed to search tracks. Please try again later.</p>';
    }
  }

  // Display search results
  function displaySearchResults(tracks) {
    searchResultsContainer.innerHTML = '';
    
    if (!tracks || tracks.length === 0) {
      searchResultsContainer.innerHTML = '<p class="error-message">No tracks found. Try a different search.</p>';
      return;
    }
    
    tracks.forEach((track, index) => {
      const trackCard = document.createElement('div');
      trackCard.className = 'track-card';
      trackCard.innerHTML = `
        <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/200'}" 
             alt="${track.name}" 
             class="track-cover"
             onerror="this.src='https://via.placeholder.com/200'">
        <div class="track-name">${track.name}</div>
        <div class="track-artist">${track.artists.map(artist => artist.name).join(', ')}</div>
        ${track.preview_url ? '' : '<div class="no-preview">No preview</div>'}
      `;
      trackCard.addEventListener('click', () => playTrack(index));
      searchResultsContainer.appendChild(trackCard);
    });
  }

  // Play a specific track
  function playTrack(index) {
    if (index < 0 || index >= tracks.length) return;

    currentTrackIndex = index;
    const track = tracks[currentTrackIndex];
    
    if (!track.preview_url) {
      alert('No preview available for this track.');
      return;
    }
    
    // Update UI
    nowPlayingTitle.textContent = track.name;
    nowPlayingArtist.textContent = track.artists.map(artist => artist.name).join(', ');
    nowPlayingCover.src = track.album.images[0]?.url || 'https://via.placeholder.com/50';
    nowPlayingCover.onerror = () => {
      nowPlayingCover.src = 'https://via.placeholder.com/50';
    };
    
    // Play the track
    audioPlayer.src = track.preview_url;
    audioPlayer.play()
      .then(() => {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      })
      .catch(error => {
        console.error('Error playing track:', error);
        alert('Could not play the track preview. Please try another track.');
      });
  }

  // Toggle play/pause
  function togglePlay() {
    if (!audioPlayer.src && tracks.length > 0) {
      playTrack(0);
      return;
    }
    
    if (isPlaying) {
      audioPlayer.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      audioPlayer.play();
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
  }

  // Play previous track
  function playPreviousTrack() {
    if (tracks.length === 0) return;
    const newIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(newIndex);
  }

  // Play next track
  function playNextTrack() {
    if (tracks.length === 0) return;
    const newIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(newIndex);
  }

  // Update progress bar
  function updateProgressBar() {
    if (isDraggingProgress) return;
    
    const { currentTime, duration } = audioPlayer;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    // Update current time display
    currentTimeDisplay.textContent = formatTime(currentTime);
  }

  // Update duration display
  function updateDurationDisplay() {
    durationDisplay.textContent = formatTime(audioPlayer.duration);
  }

  // Format time (seconds to MM:SS)
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Seek in track
  function seek(e) {
    const width = this.clientWidth || progressContainer.clientWidth;
    const clickX = e.offsetX || (e.clientX - progressContainer.getBoundingClientRect().left);
    const duration = audioPlayer.duration || 30; // Default to 30s if duration not available
    
    const seekTime = (clickX / width) * duration;
    audioPlayer.currentTime = seekTime;
  }

  // Set volume
  function setVolume() {
    const volume = this.value / 100;
    audioPlayer.volume = volume;
    
    // Update volume icon
    if (volume === 0) {
      volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
      volumeIcon.className = 'fas fa-volume-down';
    } else {
      volumeIcon.className = 'fas fa-volume-up';
    }
    
    lastVolume = this.value;
  }

  // Toggle mute
  function toggleMute() {
    if (audioPlayer.volume > 0) {
      audioPlayer.volume = 0;
      volumeSlider.value = 0;
      volumeIcon.className = 'fas fa-volume-mute';
    } else {
      audioPlayer.volume = lastVolume / 100;
      volumeSlider.value = lastVolume;
      setVolume.call(volumeSlider); // Update icon
    }
  }
});