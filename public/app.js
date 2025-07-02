document.addEventListener('DOMContentLoaded', function() {
  const audioPlayer = document.getElementById('audio-player');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const progressBar = document.getElementById('progress-bar');
  const volumeSlider = document.getElementById('volume-slider');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const featuredPlaylistsContainer = document.getElementById('featured-playlists');
  const searchResultsContainer = document.getElementById('search-results');
  const nowPlayingTitle = document.getElementById('now-playing-title');
  const nowPlayingArtist = document.getElementById('now-playing-artist');
  const nowPlayingCover = document.getElementById('now-playing-cover');

  let currentTrackIndex = 0;
  let tracks = [];
  let isPlaying = false;

  // Load featured playlists on page load
  loadFeaturedPlaylists();

  // Event listeners
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPreviousTrack);
  nextBtn.addEventListener('click', playNextTrack);
  progressBar.parentElement.addEventListener('click', seek);
  audioPlayer.addEventListener('timeupdate', updateProgressBar);
  audioPlayer.addEventListener('ended', playNextTrack);
  volumeSlider.addEventListener('input', setVolume);
  searchBtn.addEventListener('click', searchTracks);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchTracks();
  });

  // Load featured playlists from Spotify
  async function loadFeaturedPlaylists() {
    try {
      const response = await fetch('/api/featured');
      const playlists = await response.json();
      displayFeaturedPlaylists(playlists);
    } catch (error) {
      console.error('Error loading featured playlists:', error);
    }
  }

  // Display featured playlists
  function displayFeaturedPlaylists(playlists) {
    featuredPlaylistsContainer.innerHTML = '';
    playlists.forEach(playlist => {
      const playlistCard = document.createElement('div');
      playlistCard.className = 'playlist-card';
      playlistCard.innerHTML = `
        <img src="${playlist.images[0]?.url || 'https://via.placeholder.com/200'}" alt="${playlist.name}" class="playlist-cover">
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
    if (!query) return;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const searchResults = await response.json();
      tracks = searchResults;
      displaySearchResults(tracks);
    } catch (error) {
      console.error('Error searching tracks:', error);
    }
  }

  // Display search results
  function displaySearchResults(tracks) {
    searchResultsContainer.innerHTML = '';
    tracks.forEach((track, index) => {
      const trackCard = document.createElement('div');
      trackCard.className = 'track-card';
      trackCard.innerHTML = `
        <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/200'}" alt="${track.name}" class="track-cover">
        <div class="track-name">${track.name}</div>
        <div class="track-artist">${track.artists.map(artist => artist.name).join(', ')}</div>
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
    
    audioPlayer.src = track.preview_url || '';
    nowPlayingTitle.textContent = track.name;
    nowPlayingArtist.textContent = track.artists.map(artist => artist.name).join(', ');
    nowPlayingCover.src = track.album.images[0]?.url || 'https://via.placeholder.com/50';
    
    if (track.preview_url) {
      audioPlayer.play()
        .then(() => {
          isPlaying = true;
          playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        })
        .catch(error => {
          console.error('Error playing track:', error);
          alert('Could not play the track preview. Please try another track.');
        });
    } else {
      alert('No preview available for this track.');
    }
  }

  // Toggle play/pause
  function togglePlay() {
    if (audioPlayer.src) {
      if (isPlaying) {
        audioPlayer.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      } else {
        audioPlayer.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }
      isPlaying = !isPlaying;
    } else if (tracks.length > 0) {
      playTrack(0);
    }
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
    const { currentTime, duration } = audioPlayer;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
  }

  // Seek in track
  function seek(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
  }

  // Set volume
  function setVolume() {
    audioPlayer.volume = this.value / 100;
  }
});