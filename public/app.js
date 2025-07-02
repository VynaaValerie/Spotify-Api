:root {
    --primary-color: #ff6b6b;
    --secondary-color: #ff8e8e;
    --dark-color: #1a1a1a;
    --light-color: #f8f9fa;
    --text-color: #333;
    --text-light: #777;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    --border-radius: 8px;
    --transition: all 0.3s ease;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    -webkit-tap-highlight-color: transparent;
}

body {
    background-color: var(--light-color);
    color: var(--text-color);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-width: 100%;
    overflow-x: hidden;
}

.app-header {
    background-color: var(--primary-color);
    color: white;
    padding: 1rem;
    text-align: center;
    box-shadow: var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
}

.app-header h1 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.search-container {
    display: flex;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
}

#search-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: var(--border-radius) 0 0 var(--border-radius);
    font-size: 1rem;
    outline: none;
}

#search-btn {
    padding: 0 1.25rem;
    background-color: var(--dark-color);
    color: white;
    border: none;
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
    cursor: pointer;
    transition: var(--transition);
}

#search-btn:hover {
    background-color: #333;
}

.main-content {
    flex: 1;
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.featured-section, .search-results-section {
    margin-bottom: 2rem;
}

.featured-section h2, .search-results-section h2 {
    margin-bottom: 1rem;
    font-size: 1.25rem;
    color: var(--primary-color);
}

.playlists-container, .tracks-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
}

.playlist-card, .track-card {
    background-color: white;
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    transition: var(--transition);
    cursor: pointer;
}

.playlist-card:hover, .track-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.playlist-cover, .track-cover {
    width: 100%;
    height: 150px;
    object-fit: cover;
}

.playlist-info, .track-info {
    padding: 0.75rem;
}

.playlist-name, .track-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.playlist-description, .track-artist {
    font-size: 0.875rem;
    color: var(--text-light);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.player-footer {
    background-color: white;
    padding: 1rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    position: sticky;
    bottom: 0;
    z-index: 100;
}

.now-playing {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

#now-playing-cover {
    width: 50px;
    height: 50px;
    border-radius: var(--border-radius);
    object-fit: cover;
}

.track-info {
    flex: 1;
    overflow: hidden;
}

#now-playing-title {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

#now-playing-artist {
    font-size: 0.875rem;
    color: var(--text-light);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.player-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1rem;
}

.control-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
}

.control-btn:hover {
    background-color: var(--secondary-color);
    transform: scale(1.1);
}

.play-btn {
    width: 50px;
    height: 50px;
}

.progress-container {
    width: 100%;
    height: 4px;
    background-color: #e0e0e0;
    border-radius: 2px;
    cursor: pointer;
}

.progress-bar {
    height: 100%;
    background-color: var(--primary-color);
    border-radius: 2px;
    width: 0%;
    transition: width 0.1s linear;
}

/* Responsive Styles */
@media (max-width: 768px) {
    .playlists-container, .tracks-container {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
    
    .playlist-cover, .track-cover {
        height: 120px;
    }
}

@media (max-width: 480px) {
    .app-header h1 {
        font-size: 1.25rem;
    }
    
    .featured-section h2, .search-results-section h2 {
        font-size: 1.1rem;
    }
    
    .playlists-container, .tracks-container {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 0.75rem;
    }
    
    .playlist-cover, .track-cover {
        height: 100px;
    }
    
    .player-controls {
        gap: 1rem;
    }
    
    .control-btn {
        width: 36px;
        height: 36px;
    }
    
    .play-btn {
        width: 44px;
        height: 44px;
    }
}