require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url'); // for hostname extraction
const bodyParser = require('body-parser');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Middleware to serve static files and parse POST bodies
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

// In-memory database for simplicity
let urlDatabase = [];
let urlCount = 1;

// Home route
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Test endpoint
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// ===== URL Shortener API =====

// 1️⃣ POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Parse URL and validate
  let parsed;
  try {
    parsed = new URL(originalUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Must start with http or https
  if (!/^https?:\/\//i.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // Use dns.lookup to verify host
  dns.lookup(parsed.hostname, (err, address) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if already exists
    const existing = urlDatabase.find((item) => item.original_url === originalUrl);
    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url,
      });
    }

    // Create and store new short URL
    const newEntry = {
      original_url: originalUrl,
      short_url: urlCount,
    };
    urlDatabase.push(newEntry);
    urlCount++;

    res.json(newEntry);
  });
});

// 2️⃣ GET /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const short = parseInt(req.params.short_url, 10);
  const entry = urlDatabase.find((item) => item.short_url === short);

  if (entry) {
    res.redirect(entry.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

// ===== Start Server =====
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

module.exports = app; // for FCC tests
