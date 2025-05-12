// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

// Load your API key from .env
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';

app.use(cors());
app.use(express.json());

// Proxy endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) return res.status(400).json({ error: 'No message provided' });

        const url = `https://generativelanguage.googleapis.com/v1beta2/models/${MODEL}:generateMessage?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: { messages: [{ author: 'user', content: userMessage }] },
                temperature: 0.7,
                candidateCount: 1
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Gemini Error', response.status, text);
            return res.status(502).json({ error: 'Bad response from AI service' });
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content
            || data.messages?.slice(-1)[0]?.content
            || '🤖 (no reply)';
        res.json({ reply });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy listening on ${PORT}`));
