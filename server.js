require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Check for required environment variables
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.error('Missing Spotify API credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let accessToken = '';
let tokenExpiration = 0;

// Middleware to get Spotify access token
async function getSpotifyToken(req, res, next) {
  if (Date.now() < tokenExpiration) return next();

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiration = Date.now() + (response.data.expires_in * 1000);
    next();
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    res.status(500).json({ error: 'Failed to authenticate with Spotify API' });
  }
}

// API endpoint to search tracks
app.get('/api/search', getSpotifyToken, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Filter out tracks without preview URLs
    const tracksWithPreviews = response.data.tracks.items.filter(track => track.preview_url);
    res.json(tracksWithPreviews);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// API endpoint to get featured playlists
app.get('/api/featured', getSpotifyToken, async (req, res) => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/browse/featured-playlists?limit=12', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    res.json(response.data.playlists.items);
  } catch (error) {
    console.error('Featured playlists error:', error);
    res.status(500).json({ error: 'Failed to get featured playlists' });
  }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});