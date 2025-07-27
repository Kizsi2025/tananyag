import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// --- STATIKUS FÁJLOK KISZOLGÁLÁSA ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- MONGODB KAPCSOLAT ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retrogyarAuth');
    console.log('✅ MongoDB kapcsolat aktív');
  } catch (err) {
    console.error('❌ MongoDB hiba:', err.message);
    process.exit(1);
  }
};

// --- USER MODEL ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// --- JWT MIDDLEWARE ---
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Nincs token' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret');
    next();
  } catch {
    return res.status(403).json({ msg: 'Érvénytelen token' });
  }
};

// --- AUTH VÉGPONTOK ---

// Regisztráció
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Minden mező kitöltése kötelező' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ msg: 'Ez az e-mail cím már regisztrálva van' });
    }

    const user = await User.create({ name, email, password });
    
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: process.env.JWT_EXPIRES || '1d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Regisztrációs hiba:', error);
    return res.status(500).json({ msg: 'Szerverhiba történt' });
  }
});

// Bejelentkezés
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ msg: 'E-mail és jelszó megadása kötelező' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: 'Hibás e-mail vagy jelszó' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ msg: 'Hibás e-mail vagy jelszó' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: process.env.JWT_EXPIRES || '1d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Bejelentkezési hiba:', error);
    return res.status(500).json({ msg: 'Szerverhiba történt' });
  }
});

// Profil lekérése (védett végpont)
app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Felhasználó nem található' });
    }
    
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Profil lekérési hiba:', error);
    return res.status(500).json({ msg: 'Szerverhiba történt' });
  }
});

// --- AI PITCH ÉRTÉKELŐ ---
const apiKey = process.env.PERPLEXITY_API_KEY;
let perplexity = null;

if (apiKey) {
  perplexity = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.perplexity.ai',
  });
  console.log('🤖 AI pitch értékelő aktív');
} else {
  console.log('⚠️  AI pitch értékelő inaktív (nincs API kulcs)');
}

// Védett AI értékelő végpont
app.post('/evaluate', verifyToken, async (req, res) => {
  if (!perplexity) {
    return res.status(503).json({ error: 'AI szolgáltatás nem elérhető' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'A "prompt" mező hiányzik' });
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
    console.error('AI értékelési hiba:', error);
    res.status(500).json({
      error: 'Hiba történt az értékelés során',
      details: error.message
    });
  }
});

// Nyilvános AI értékelő végpont (korlátozott)
app.post('/evaluate-public', async (req, res) => {
  if (!perplexity) {
    return res.json({
      result: 'Demo válasz: Az ötleted érdekes, de további részletek szükségesek. Fejlesztési javaslatok: 1) Konkrétabb példák 2) Költség-haszon elemzés'
    });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'A "prompt" mező hiányzik' });
    }

    const completion = await perplexity.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'Rövid ipari MI pitch értékelésére szakosodott asszisztens vagy.'
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
    console.error('AI értékelési hiba:', error);
    res.json({
      result: 'Sajnos most nem tudom értékelni a pitch-et, kérlek próbáld később.'
    });
  }
});

// --- ALAPÉRTELMEZETT ÚTVONAL ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- SZERVER INDÍTÁSA ---
const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Szerver fut: http://localhost:${PORT}`);
    console.log(`📁 Statikus fájlok: ${path.join(__dirname, 'public')}`);
    console.log(`🔐 JWT auth aktív`);
    console.log(`📊 MongoDB csatlakoztatva`);
  });
})();