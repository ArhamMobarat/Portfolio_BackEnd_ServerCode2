import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const requireAuth = (req, res, next) => {
  if (req.headers['x-admin-auth'] !== 'true') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ----------------temp logging ----------------------------
app.get('/', (req, res) => {
  res.send('Backend is running');
});


app.post('/sheets', async (req, res) => {
  try {
    const { action, data } = req.body;

    const WEB_APP_URL = process.env.GOOGLE_SHEETS_WEB_APP_URL;
    const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        apiKey: API_KEY,
        data,
      }),
    });

    const text = await response.text();   // 👈 CHANGE THIS
    console.log('Apps Script raw response:', text);

    const json = JSON.parse(text);
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Google Sheets proxy failed' });
  }
});

// ---------------------------------------------------------

// app.post('/sheets', async (req, res) => {
//   try {
//     const { action, data } = req.body;

//     const WEB_APP_URL = process.env.GOOGLE_SHEETS_WEB_APP_URL;
//     const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

//     const response = await fetch(WEB_APP_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'text/plain;charset=utf-8',
//       },
//       body: JSON.stringify({
//         action: 'list',
//         apiKey: API_KEY,
//         data,
//       }),
//     });

//     const json = await response.json();
//     res.json(json);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Google Sheets proxy failed' });
//   }
// });




app.post('/upload-image', async (req, res) => {
  try {
    const { fileName, fileBase64, projectSlug } = req.body;
    // dotenv.config();
    const token = process.env.GITHUB_IMAGES_TOKEN;
    const OWNER = 'ArhamMobarat';
    const REPO = 'portfolio-images';

    const path = `projects/${projectSlug}/${fileName}`;

    const githubRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload ${fileName}`,
          content: fileBase64,
        }),
      }
    );

    const data = await githubRes.json();

    if (!githubRes.ok) {
      return res.status(500).json({ error: data.message });
    }

    res.json({ url: data.content.download_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});
app.post('/login', (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }

  res.status(401).json({ error: 'Invalid password' });
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
