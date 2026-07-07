require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nogoon_secret_key_1337_sigmas';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Punishments pool
const PUNISHMENTS = [
  "Post 'I fold under pressure, I am a certified gooner' on your main Instagram/Snapchat story for 24 hours. No context allowed.",
  "Send your crush a text saying: 'I think about you when I mew.' Then delete the app and don't reply for 2 hours.",
  "Do 100 push-ups on camera and send the time-lapse to the group chat.",
  "Delete TikTok, Instagram, and YouTube Shorts for 48 hours. Send screen time proof afterwards.",
  "Venmo the other two friends $5 each. Tax for folding.",
  "Speak only in brainrot Gen Z slang (Skibidi, Rizzler, Sigma, Mewing, Gyatt) for the next 2 hours on voice call with the boys.",
  "Read 15 pages of a physical self-improvement book and write a 100-word summary for the group chat.",
  "Take a cold shower for 3 minutes straight. Send a video of your face right after (must be shivering).",
  "Write a 100-word formal apology letter on your relapse and post it in the public feed.",
  "No phone usage after 9 PM for 3 consecutive days. Send screenshots of your battery sleep logs to the chat.",
  "Text your mom 'I got the rizz of a sigma' and send a screenshot of her reaction.",
  "Do a 2-minute wall sit while holding a sign that says 'I broke the streak.' Send photo proof.",
  "Meditate in absolute silence for 20 minutes, then write a short paragraph on what you realized.",
  "Delete your most played game (e.g. Fortnite, Valorant, Brawl Stars) for 3 days.",
  "Clean your entire room, take a before/after photo, and post it to the group chat.",
  "Run 2 miles (or walk 3 miles) and send a screenshot of your Strava / fitness tracker log.",
  "Put on your most ridiculous outfit and walk around the block. Send a video.",
  "Go to sleep before 10:30 PM tonight. Send a screenshot of your sleep tracker showing you actually did it.",
  "Text your dad 'Are you proud of my mewing streak?' and send a screenshot of his response.",
  "Stand in the corner of your room and do the 'Looksmaxxing jawline check' for 5 minutes straight.",
  "Text the group chat 'I am a beta male' every hour on the hour for 6 hours straight.",
  "Delete Snapchat for 24 hours. Show screen time proof.",
  "Cook a healthy meal from scratch, take a picture, and send the recipe to the group chat.",
  "Drink 1 gallon of water today. Send time-stamped pictures of the empty bottles.",
  "Spend 15 minutes doing yoga or stretching. Send a photo of you holding a difficult pose.",
  "Call your friends and read them a page of a dictionary with a completely serious voice.",
  "Change your profile picture on this app to an embarrassing picture of your friends' choice for 3 days.",
  "Draw a portrait of the friend with the highest streak and post it in the chat.",
  "Wake up at 6:00 AM tomorrow and send a selfie to the group chat to prove it.",
  "Write a 4-line poem about how bad gooning is and post it in the feed.",
  "Do 50 squats on video and send it to the group chat.",
  "Put your phone in 'Do Not Disturb' mode for 6 hours straight during the day.",
  "Call your local gym and ask them if they have a 'Looksmaxxing division'. Send a voice note of the call.",
  "Listen to the Cocomelon theme song on loop for 15 minutes. Send a video showing your screen.",
  "Text your crush 'I have a confession... pineapple on pizza is goated.' Don't explain.",
  "Change your wallpaper to a picture of your friends' choice for 48 hours. Send screenshot proof.",
  "No sugar or soda for the next 48 hours. Report your meals.",
  "Do a 3-minute plank on video. No resting.",
  "Write 'I must lock in' 100 times on a physical piece of paper and send a photo.",
  "Clean your keyboard and desk setup. Send a photo of the clean setup.",
  "Unfollow 10 brainrot meme accounts on Instagram or TikTok. Send screenshots.",
  "Handwrite a thank-you note to one of your friends, take a photo, and send it to them.",
  "Sit on the floor and do 100 Russian twists on video.",
  "Complete a 10-minute guide on mindfulness on YouTube and summarize it in 3 sentences.",
  "Text the last person you messaged on Snapchat: 'I fold under pressure.'",
  "Go for a 20-minute walk outside without using your phone. Send a photo of a tree you saw.",
  "Do 40 burpees on camera and send it to the group chat.",
  "Read a Wikipedia article about a historical event and explain it to the group chat in Gen Z terms.",
  "Donate $2 to a charity of your choice and send the receipt to the group chat.",
  "Put ice cubes in your shirt for 30 seconds and send a video of your reaction."
];

// Helper: Calculate streak info
function getStreakInfo(streakStartStr, status) {
  if (!streakStartStr || status === 'COOKED') {
    return { days: 0, hours: 0, display: '0d 0h', totalHours: 0 };
  }
  const start = new Date(streakStartStr);
  const now = new Date();
  const diffMs = now - start;
  if (diffMs < 0) return { days: 0, hours: 0, display: '0d 0h', totalHours: 0 };

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return {
    days,
    hours,
    display: `${days}d ${hours}h`,
    totalHours
  };
}



// Authentication middleware
async function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated. Log in, slacker.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Session expired. Relog.' });
  }
}

// --- API Endpoints ---

// Get config (Google Client ID)
app.get('/api/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID });
});

// Google Sign-In
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  try {
    let payload;
    if (googleClient) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else {
      return res.status(500).json({ error: 'Google client not configured on server.' });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const picture = payload.picture;

    // Check if user with this googleId exists
    const userRes = await db.query(`SELECT * FROM users WHERE google_id = $1`, [googleId]);
    let user = userRes.rows[0];

    if (!user) {
      // Need to claim one of Dax, Max, Reese
      const unclaimedRes = await db.query(`SELECT id, name FROM users WHERE google_id IS NULL`);
      return res.json({ 
        claimRequired: true, 
        googleId, 
        email, 
        picture,
        unclaimed: unclaimedRes.rows 
      });
    }

    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, picture: user.picture }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Google Auth verification error:', err);
    res.status(400).json({ error: 'Invalid ID Token' });
  }
});

// Google Claim Identity
app.post('/api/auth/google/claim', async (req, res) => {
  const { credential, claimId } = req.body;
  if (!credential || !claimId) return res.status(400).json({ error: 'Missing parameters' });

  try {
    let payload;
    if (googleClient) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else {
      return res.status(500).json({ error: 'Google client not configured on server.' });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const picture = payload.picture;

    // Check if googleId already claimed
    const checkUser = await db.query(`SELECT * FROM users WHERE google_id = $1`, [googleId]);
    if (checkUser.rows[0]) {
      return res.status(400).json({ error: 'You have already claimed an identity! Log in normally.' });
    }

    // Check if target identity is free
    const targetRes = await db.query(`SELECT * FROM users WHERE id = $1`, [claimId]);
    const target = targetRes.rows[0];
    
    if (!target) return res.status(404).json({ error: 'Target identity not found.' });
    if (target.google_id) {
      return res.status(400).json({ error: `Identity ${target.name} has already been claimed by a friend!` });
    }

    // Claim target identity
    const now = new Date().toISOString();
    await db.query(
      `UPDATE users SET google_id = $1, email = $2, picture = $3, last_check_in = $4 WHERE id = $5`,
      [googleId, email, picture, now, claimId]
    );

    const updatedUserRes = await db.query(`SELECT * FROM users WHERE id = $1`, [claimId]);
    const user = updatedUserRes.rows[0];

    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, picture: user.picture }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Google claim error:', err);
    res.status(500).json({ error: 'Failed to claim identity' });
  }
});

// Mock Login for Dev / Testing
app.post('/api/auth/mock', async (req, res) => {
  const { mockUser } = req.body;
  const mockProfiles = {
    dax: { id: 'dax', email: 'dax@nogoon.club', name: 'Dax 🤫🧏‍♂️', picture: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=dax' },
    max: { id: 'max', email: 'max@nogoon.club', name: 'Max ⚡', picture: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=max' },
    reese: { id: 'reese', email: 'reese@nogoon.club', name: 'Reese 👑', picture: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=reese' }
  };

  const profile = mockProfiles[mockUser];
  if (!profile) return res.status(400).json({ error: 'Invalid mock user' });

  const now = new Date().toISOString();

  try {
    const userRes = await db.query(`SELECT * FROM users WHERE id = $1`, [profile.id]);
    let user = userRes.rows[0];

    if (!user) {
      await db.query(
        `INSERT INTO users (id, google_id, email, name, picture, streak_start, last_check_in, highest_streak, status) 
         VALUES ($1, NULL, $2, $3, $4, $5, $6, 0, 'ACTIVE')`,
        [profile.id, profile.email, profile.name, profile.picture, now, now]
      );
      user = { id: profile.id, ...profile, streak_start: now, last_check_in: now, highest_streak: 0, status: 'ACTIVE' };
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, picture: user.picture }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Mock login error:', err);
    res.status(500).json({ error: 'Mock login database error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Fetch info on current user
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const now = new Date().toISOString();
    await db.query(`UPDATE users SET last_check_in = $1 WHERE id = $2`, [now, req.user.id]);

    const userRes = await db.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch active punishment if cooked
    let punishment = null;
    if (user.status === 'COOKED') {
      const punRes = await db.query(
        `SELECT * FROM punishments WHERE user_id = $1 AND status = 'PENDING' ORDER BY id DESC LIMIT 1`,
        [user.id]
      );
      punishment = punRes.rows[0] || null;
    }

    const streakInfo = getStreakInfo(user.streak_start, user.status);

    res.json({
      user: {
        ...user,
        streakInfo
      },
      activePunishment: punishment
    });
  } catch (err) {
    res.status(500).json({ error: 'Database fetch error' });
  }
});

// Fetch Leaderboard and Feed
app.get('/api/users', async (req, res) => {
  try {
    // Get all users
    const usersRes = await db.query(`SELECT * FROM users ORDER BY created_at ASC`);
    
    // Process streaks
    const users = usersRes.rows.map(user => {
      const streakInfo = getStreakInfo(user.streak_start, user.status);
      return {
        id: user.id,
        name: user.name,
        picture: user.picture,
        status: user.status,
        last_check_in: user.last_check_in,
        highest_streak: user.highest_streak,
        streakInfo
      };
    });

    // Sort users by current streak hours descending
    users.sort((a, b) => b.streakInfo.totalHours - a.streakInfo.totalHours);

    // Fetch recent punishments/relapses feed
    // Sort by created_at DESC
    const feedRes = await db.query(
      `SELECT p.*, u.name, u.picture 
       FROM punishments p 
       JOIN users u ON p.user_id = u.id 
       ORDER BY p.id DESC LIMIT 15`
    );

    res.json({
      users,
      feed: feedRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch error' });
  }
});

// Relapse (I Cooked It)
app.post('/api/relapse', authenticateToken, async (req, res) => {
  const { reason } = req.body;
  const now = new Date().toISOString();

  try {
    const userRes = await db.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    const user = userRes.rows[0];

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status === 'COOKED') {
      return res.status(400).json({ error: 'You are already cooked! Finish your current punishment!' });
    }

    // Calculate current streak to update highest streak if needed
    const streakInfo = getStreakInfo(user.streak_start, user.status);
    if (streakInfo.totalHours > user.highest_streak) {
      await db.query(
        `UPDATE users SET highest_streak = $1 WHERE id = $2`,
        [streakInfo.totalHours, user.id]
      );
    }

    // Select random punishment
    const basePunishment = PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)];
    const reasonText = reason ? `Reason: ${reason}. ` : '';
    const punishmentText = `${reasonText}PUNISHMENT: ${basePunishment}`;

    // Update user status
    await db.query(
      `UPDATE users SET status = 'COOKED', streak_start = NULL WHERE id = $1`,
      [user.id]
    );

    // Record punishment
    await db.query(
      `INSERT INTO punishments (user_id, punishment_text, status, created_at) VALUES ($1, $2, 'PENDING', $3)`,
      [user.id, punishmentText, now]
    );

    res.json({
      success: true,
      message: 'You have officially cooked it. The council has decided your punishment.',
      punishment: punishmentText
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Relapse logging failed' });
  }
});

// Complete Punishment (Requires Photo Proof)
app.post('/api/resolve-punishment', authenticateToken, async (req, res) => {
  const { imageData } = req.body;
  const now = new Date().toISOString();

  if (!imageData) {
    return res.status(400).json({ error: 'You must upload a photo to prove you completed your punishment! No cap.' });
  }

  try {
    const userRes = await db.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    const user = userRes.rows[0];

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'COOKED') {
      return res.status(400).json({ error: 'You are not cooked. Go check in or something.' });
    }

    // Resolve the active pending punishment
    const activePunRes = await db.query(
      `SELECT * FROM punishments WHERE user_id = $1 AND status = 'PENDING' ORDER BY id DESC LIMIT 1`,
      [user.id]
    );
    const activePun = activePunRes.rows[0];
    
    if (activePun) {
      await db.query(
        `UPDATE punishments SET status = 'COMPLETED', completed_at = $1 WHERE id = $2`,
        [now, activePun.id]
      );
    }

    // Post to chat automatically as proof
    const msgText = `🛡️ MEWING RESURRECTION: I completed my punishment! ("${activePun ? activePun.punishment_text : 'My punishment'}")`;
    await db.query(
      `INSERT INTO messages (user_id, message_text, image_data, created_at) VALUES ($1, $2, $3, $4)`,
      [user.id, msgText, imageData, now]
    );

    // Reset user back to ACTIVE, start streak from now
    await db.query(
      `UPDATE users SET status = 'ACTIVE', streak_start = $1, last_check_in = $2 WHERE id = $3`,
      [now, now, user.id]
    );

    res.json({
      success: true,
      message: 'Punishment resolved! Your mewing streak has been reset to 0d 0h. Do better this time.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Punishment resolution failed' });
  }
});

// Get Chat Messages (Last 50)
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messagesRes = await db.query(
      `SELECT m.*, u.name, u.picture 
       FROM messages m 
       JOIN users u ON m.user_id = u.id 
       ORDER BY m.id DESC LIMIT 50`
    );
    res.json(messagesRes.rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Post Chat Message
app.post('/api/messages', authenticateToken, async (req, res) => {
  const { messageText, imageData } = req.body;
  const now = new Date().toISOString();

  if (!messageText && !imageData) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    await db.query(
      `INSERT INTO messages (user_id, message_text, image_data, created_at) VALUES ($1, $2, $3, $4)`,
      [req.user.id, messageText || null, imageData || null, now]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Nudge/Shame a Friend (Writes system message to chatroom)
app.post('/api/users/:id/nudge', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const callerId = req.user.id;
  const now = new Date().toISOString();

  if (targetId === callerId) {
    return res.status(400).json({ error: 'You cannot nudge yourself, self-mewer.' });
  }

  try {
    const targetRes = await db.query(`SELECT * FROM users WHERE id = $1`, [targetId]);
    const target = targetRes.rows[0];
    if (!target) return res.status(404).json({ error: 'Target friend not found' });

    const callerRes = await db.query(`SELECT * FROM users WHERE id = $1`, [callerId]);
    const caller = callerRes.rows[0];
    if (!caller) return res.status(404).json({ error: 'Caller profile not found. Log in again.' });

    const isCooked = target.status === 'COOKED';
    const nudgeText = isCooked 
      ? `💀 SHAME: ${caller.name} shamed ${target.name} for being cooked! 🍳`
      : `🤫 NUDGE: ${caller.name} nudged ${target.name} to lock in and mew! 🧏‍♂️`;

    // Insert into messages as a system message
    await db.query(
      `INSERT INTO messages (user_id, message_text, image_data, created_at) VALUES ($1, $2, $3, $4)`,
      [callerId, nudgeText, null, now]
    );

    res.json({ success: true, message: `Friend notified!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nudge operation failed' });
  }
});

// Serve frontend main page on any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database initialization & server startup
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`NoGoon Server is cooking on port ${PORT}! 🚀`);
    if (!GOOGLE_CLIENT_ID) {
      console.log('WARNING: GOOGLE_CLIENT_ID not set. Google Sign-In will not function, but Mock Login is enabled for dev.');
    }
  });
}).catch(err => {
  console.error('Server failed to start due to database error:', err);
});
