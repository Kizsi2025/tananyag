import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'path'; // <-- Új import a path kezeléséhez
import { fileURLToPath } from 'url'; // <-- Új import a path kezeléséhez

const app = express();

// --- ÚJ RÉSZ KEZDETE: Statikus fájlok kiszolgálása ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// A public mappa beállítása a statikus fájlok (HTML, CSS, JS) számára
app.use(express.static(path.join(__dirname, 'public')));
// --- ÚJ RÉSZ VÉGE ---

app.use(express.json());

const apiKey = process.env.PERPLEXITY_API_KEY;
if (!apiKey) {
  throw new Error('A PERPLEXITY_API_KEY környezeti változó nincs beállítva!');
}

const perplexity = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.perplexity.ai',
});


app.post('/evaluate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'A "prompt" mező hiányzik a kérésből.' });
    }

    const completion = await perplexity.chat.completions.create({
      
      model: 'sonar-pro', 
     
      messages: [
        {
          role: 'system',
          content: 'Rövid ipari MI pitch értékelésére szakosodott asszisztens vagy. Adj pontszámot 0-10-ig, majd rövid indoklást és 2 fejlesztési javaslatot.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    res.json({
      result: completion.choices[0].message.content
    });

  } catch (error) {
    console.error('Hiba történt az API hívás során:', error);
    res.status(500).json({
      error: 'Hiba történt a kiértékelés során.',
      details: error.message 
    });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Szerver fut a http://localhost:${PORT} címen`);
});

export default app;
