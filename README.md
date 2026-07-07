# NoGoon Club (🗿 NOGOON.CLUB)

A mobile-optimized, Gen Z themed daily streak tracker designed specifically for Safari on iOS. Keep your streaks, check in daily, and compete on a 3-person leaderboard. If you relapse (or forget to check in for 36 hours), you enter `COOKED` status and must complete a hilarious or challenging punishment before you can start tracking your streak again.

Powered by Google Sign-In, running off Node.js Express, and ready for 24/7 deployment on **Railway**.

---

## Features

1. **Mobile Safari Optimized**: Built using dynamic viewports (`100dvh`), iOS notch padding safe-areas, native touch scrolling physics, and zero-delay active buttons.
2. **PWA Standalone Support**: Add it to your iPhone home screen for a full-screen, native-app feel (no Safari search bar).
3. **Leaderboard Podium**: Ranks the group 1st, 2nd, and 3rd with visual gold/silver/bronze glowing podium cards.
4. **Automated Shame Feed**: Displays recent check-ins, relapses (with reasons), and punishment resolutions.
5. **Enforced Lazy Check-Ins**: If you go 36 hours without checking in, the server automatically relapses you and assigns a punishment!
6. **Google Sign-In**: Zero password management. Simple, secure OAuth.
7. **Developer Mock Mode**: Test the app instantly without Google API keys using pre-configured mock characters.

---

## Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *For local testing, you can leave `DATABASE_URL` blank. The app will automatically fall back to a local SQLite database (`nogoon.db`).*
   *You can also leave `GOOGLE_CLIENT_ID` blank initially; you will be able to use the **Developer Mock Login** buttons.*

3. **Start the Server**:
   ```bash
   npm start
   ```
   The app will run at [http://localhost:3000](http://localhost:3000).

---

## Google OAuth 2.0 Credentials Setup

To enable Google Sign-In, follow these steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project called **NoGoon Club**.
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - Choose **External**.
   - Fill in the App Name, User support email, and Developer contact information.
   - Click **Save and Continue** (skip scopes for now).
4. Navigate to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Select Application type: **Web application**.
   - Name: `NoGoon Club Web App`.
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:3000` (for local development)
     - `https://your-app-name.up.railway.app` (your future Railway domain)
   - Click **Create**.
5. Copy the **Client ID** and add it to your `.env` file (or Railway variables) as `GOOGLE_CLIENT_ID`.

---

## Railway 24/7 Deployment Instructions

Deploying this app to Railway is incredibly simple:

### Step 1: Push to GitHub
Create a private repository on GitHub, commit your code, and push it:
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway
1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo** and select your repository.
3. Railway will detect the Node.js project and begin building it.

### Step 3: Add a PostgreSQL Database (Optional but Recommended)
SQLite works locally, but on Railway, server filesystems are ephemeral (they reset on deployments/restarts). To keep your streaks 24/7:
1. In your Railway project dashboard, click **+ Add** > **Database** > **Add PostgreSQL**.
2. Railway will deploy a database and automatically inject the `DATABASE_URL` environment variable into your Node.js application! The app will detect this and switch to PostgreSQL automatically.

### Step 4: Configure Environment Variables on Railway
Go to the **Variables** tab of your Node.js service on Railway and add:
- `GOOGLE_CLIENT_ID` = `(Your Google Client ID from Google Cloud Console)`
- `JWT_SECRET` = `(A long random string, e.g., secret_mewing_sigma_key)`

### Step 5: Get your Public URL
1. Go to the **Settings** tab of your Node.js service on Railway.
2. Under **Environment** > **Public Networking**, click **Generate Domain** (or set a custom one).
3. Copy this URL (e.g. `https://nogoon.up.railway.app`) and add it to the **Authorized JavaScript origins** in your Google Cloud Console.

---

## Render 24/7 Deployment Instructions

If you prefer to use **Render** (which has a great free tier for hosting), follow these steps:

### Step 1: Push your Code to GitHub
Ensure your repository is uploaded to GitHub.

### Step 2: Create a PostgreSQL Database on Render
SQLite files reset every time Render restarts or deploys. To keep your streaks safe, configure PostgreSQL:
1. Log in to [Render.com](https://render.com/).
2. Click **New +** in the top right and select **PostgreSQL**.
3. Name: `nogoon-db`.
4. Database & User: (Leave default or set `nogoon`).
5. Click **Create Database**.
6. Once active, copy the **External Connection String** (e.g. `postgresql://nogoon_user:password@hostname/nogoon_db`).

### Step 3: Deploy the Web Service on Render
1. Click **New +** in the top right and select **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `nogoon-club`
   - **Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Click **Advanced** > **Add Environment Variable**:
   - `DATABASE_URL` = `(Paste the PostgreSQL External Connection String you copied in Step 2)`
   - `GOOGLE_CLIENT_ID` = `(Your Google Client ID from Google Cloud Console)`
   - `JWT_SECRET` = `(A long random string, e.g., secret_mewing_sigma_key)`
5. Click **Create Web Service**.

### Step 4: Add Render URL to Google OAuth
1. Copy your Render Web Service URL (e.g., `https://nogoon-club.onrender.com`).
2. Go to your [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
3. Open your OAuth 2.0 Client ID.
4. Add the Render URL to the **Authorized JavaScript origins** list.
5. Save changes.

---

## Mobile Safari Installation (Add to Home Screen)

1. Open your Railway app URL in Safari on your iPhone.
2. Tap the **Share** button (the arrow up icon in the bottom menu).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right.
5. The **NoGoon** icon will now appear on your home screen. Launch it to experience a full-screen, standalone application!
