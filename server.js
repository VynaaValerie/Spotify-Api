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

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let accessToken = '';
let tokenExpiration = 0;

// Middleware to get Spotify access token
async function getSpotifyToken() {
  if (Date.now() < tokenExpiration) return;

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
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw new Error('Failed to authenticate with Spotify API');
  }
}

// API endpoint to search tracks
app.get('/api/search', async (req, res) => {
  try {
    await getSpotifyToken();
    const query = req.query.q;
    const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    res.json(response.data.tracks.items);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// API endpoint to get featured playlists
app.get('/api/featured', async (req, res) => {
  try {
    await getSpotifyToken();
    const response = await axios.get('https://api.spotify.com/v1/browse/featured-playlists?limit=10', {
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Spotify Client ID: ${SPOTIFY_CLIENT_ID ? 'Configured' : 'Missing'}`);
});