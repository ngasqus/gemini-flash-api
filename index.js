// Load environment variables
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai'; // ✅ package resmi
import { text } from 'stream/consumers';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Inisialisasi AI Client
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Pilih model default
const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(express.json());

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

// Fungsi untuk extract text
function extractText(resp) {
    try {
        // Untuk API baru, outputnya biasanya langsung di candidates[0].content.parts[0].text
        return resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text
            || resp?.candidates?.[0]?.content?.parts?.[0]?.text
            || JSON.stringify(resp, null, 2);
    } catch (err) {
        console.error('Error extracting text:', err);
        return JSON.stringify(resp, null, 2);
    }
}

// 1. Generate Text
app.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const model = ai.getGenerativeModel({ model: GEMINI_MODEL });

        const resp = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        });

        res.json({ result: extractText(resp) });

    } catch (err) {
        console.error('Error generating text:', err);
        res.status(500).json({
            error: err.message,
            stack: err.stack
        });
    }
});

// 2. Generate From Image
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const imageBase64 = req.file.buffer.toString('base64');

        const model = ai.getGenerativeModel({ model: GEMINI_MODEL });

        const resp = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt || '' },
                        {
                            inlineData: {
                                mimeType: req.file.mimetype,
                                data: imageBase64
                            }
                        }
                    ]
                }
            ]
        });

        res.json({ result: extractText(resp) });
    } catch (err) {
        console.error('Error generating from image:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Generate From Document
// 3. Generate From Document
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'Document file is required' });
        }

        const docBase64 = req.file.buffer.toString('base64');

        const model = ai.getGenerativeModel({ model: GEMINI_MODEL });

        const resp = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt || "Ringkas dokumen berikut:" },
                        {
                            inlineData: {
                                mimeType: req.file.mimetype,
                                data: docBase64
                            }
                        }
                    ]
                }
            ]
        });

        res.json({ result: extractText(resp) });
    } catch (err) {
        console.error('Error generating from document:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Generate From Audio
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'Audio file is required' });
        }

        const audioBase64 = req.file.buffer.toString('base64');

        const model = ai.getGenerativeModel({ model: GEMINI_MODEL });

        const resp = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt || "Analisa audio berikut:" },
                        {
                            inlineData: {
                                mimeType: req.file.mimetype, // contoh: 'audio/mpeg' atau 'audio/wav'
                                data: audioBase64
                            }
                        }
                    ]
                }
            ]
        });

        res.json({ result: extractText(resp) });
    } catch (err) {
        console.error('Error generating from audio:', err);
        res.status(500).json({ error: err.message });
    }
});