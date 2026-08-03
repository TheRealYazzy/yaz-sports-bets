# 🚀 YAZ SPORTS BETS - Complete Setup Guide

Follow this guide to get Yaz Sports Bets running in 20 minutes.

---

## Part 1: GitHub Setup (5 minutes)

### Step 1.1: Create GitHub Repository

1. Go to https://github.com/new
2. Name: `yaz-sports-bets`
3. Visibility: Public
4. Click "Create repository"

### Step 1.2: Upload Files

Your GitHub repo is now empty. I've created all files for you. Here's how to add them:

**Option A: Upload via GitHub Web Interface (Easiest)**

1. In your new repo, click "uploading an existing file" (or "Add file" → "Upload files")
2. Download all the files I've created (they should be available)
3. Drag & drop all files into GitHub
4. GitHub will automatically organize them into folders
5. Add commit message: "Initial Yaz Sports Bets build"
6. Click "Commit changes"

**Option B: Upload via GitHub Desktop**

1. Clone your repo to your computer
2. Copy all files into the folder
3. Commit and push

---

## Part 2: Vercel Setup (10 minutes)

### Step 2.1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Authorize Vercel to access your GitHub account

### Step 2.2: Create Vercel Project

1. Click "Add New..." → "Project"
2. Select `yaz-sports-bets` repository
3. Click "Import"

### Step 2.3: Add Environment Variables

Before deploying, add your secrets:

1. In the import screen, click "Environment Variables"
2. Add these:

```
DATABASE_URL = [You'll create this in step 2.5]
OPENWEATHER_API_KEY = Get from openweathermap.org (free)
NODE_ENV = production
```

3. Click "Deploy"

**It will fail because DATABASE_URL isn't ready yet - that's OK!**

### Step 2.4: Get OpenWeather API Key (2 minutes)

1. Go to https://openweathermap.org/api
2. Click "Sign Up"
3. Create free account
4. Go to API keys tab
5. Copy "API key"
6. Back in Vercel → Project Settings → Environment Variables
7. Update `OPENWEATHER_API_KEY` with your key
8. Save

### Step 2.5: Create Vercel Postgres Database

1. In Vercel Dashboard, click your `yaz-sports-bets` project
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Create new database
6. Copy the connection string
7. Go to "Settings" → "Environment Variables"
8. Add/update `DATABASE_URL` with the connection string
9. Redeploy project (click "Deployments" → "..." → "Redeploy")

### Step 2.6: Set Up Database Schema

1. Go to Storage → Postgres → Select your database
2. Click "Query" tab
3. Copy & paste the entire SQL schema from `DATABASE_SETUP.md`
4. Execute

✅ **Your app is now live!** Go to your Vercel project URL to see it.

---

## Part 3: GitHub Actions Setup (3 minutes)

GitHub Actions will automatically run edge detection every hour.

### Step 3.1: Add Secrets to GitHub

1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:

**Secret 1: DATABASE_URL**
- Value: Your Vercel Postgres connection string

**Secret 2: OPENWEATHER_API_KEY**
- Value: Your OpenWeather API key

### Step 3.2: Enable Actions

1. Go to "Actions" tab in your repo
2. Click "I understand my workflows..."
3. Click "enable" under "Yaz Sports Bets - Scheduled Jobs"

✅ **GitHub Actions are now active!** They'll run:
- **Hourly**: Edge detection (at the top of every hour)
- **Daily**: Advanced analysis (8am, 2pm, 8pm UTC)

---

## Part 4: Test Everything (2 minutes)

### Step 4.1: Test Frontend

1. Go to your Vercel project URL
2. You should see the Yaz Sports Bets dashboard
3. Click "Refresh" button
4. It should load edges (may take 30 seconds on first run)

### Step 4.2: Test API

1. Go to `https://your-url.vercel.app/api/health`
2. Should return: `{"status":"ok",...}`

### Step 4.3: Test GitHub Actions

1. Go to your repo → "Actions" tab
2. You should see a workflow called "Yaz Sports Bets - Scheduled Jobs"
3. Click it → "Run workflow" → "Run workflow"
4. Watch it execute (should complete in 1-2 minutes)

✅ **Everything working? You're done!**

---

## Usage Guide

### Daily Workflow

1. **Morning**: Open app, see today's edges
2. **During Day**: Click "TAKE BET" on high-confidence edges
3. **Take Bet**: Go to your sportsbook (DraftKings, FanDuel, Bovada)
4. **Find the specific bet** (player, props line, etc.)
5. **Place bet** on your sportsbook
6. **Back in app**: App auto-tracks your performance

### Bet Tracking

- App stores bets in your browser (localStorage)
- Shows wins/losses/ROI per day/week/month
- To mark bet as won/lost: (Future feature - currently manual)

### Viewing Edges

**Filters Available:**
- **Sport**: NBA, NFL, MLB, All
- **Min Confidence**: 75%, 80%, 85%, 90%+
- **Edge Type**: Injury, Matchup, Usage, etc.

**Each Edge Shows:**
- Confidence % (🔥 icon color-coded)
- What the edge is
- Predicted outcome
- Historical accuracy

---

## Customization

### Change Refresh Interval

In `frontend/app.js`:
```javascript
// Auto-refresh every hour (3600000 ms)
setInterval(refreshEdges, 3600000);

// Change to 30 minutes:
setInterval(refreshEdges, 1800000);
```

### Change Minimum Confidence Display

In `backend/api/edges.js`:
```javascript
const minConfidence = parseFloat(req.query.confidence) || 75;

// Change default from 75 to 80:
const minConfidence = parseFloat(req.query.confidence) || 80;
```

### Add Custom Edge Type

In `backend/engines/edgeDetection.js`, add a new detection function and include it in `detectEdges()`.

---

## Troubleshooting

### "Failed to load edges" Error

1. Check internet connection
2. Go to Vercel → Logs
3. Look for error messages
4. Common fixes:
   - Restart app: Vercel dashboard → "Redeploy"
   - Check env vars are set
   - Verify database is running

### No GitHub Actions Running

1. Check Settings → Actions → "Action permissions"
2. Should be "Allow all actions..."
3. If not, update it
4. Re-run workflow manually

### Database Connection Error

1. Verify `DATABASE_URL` in Vercel env
2. Check Postgres database exists
3. Try connecting directly in Vercel dashboard

### Scraping Fails (No Data)

This is normal at first. The APIs may:
- Change their structure
- Rate-limit requests
- Be temporarily down

**Fix**: Update selectors in `backend/api/` files

---

## Next Steps

Now that you're up and running:

1. **Monitor for 1-2 weeks**: See which edges hit
2. **Track your results**: Use app to record wins/losses
3. **Validate accuracy**: Compare to backtesting results
4. **Adjust confidence threshold**: If 75% is too strict, try 70%
5. **Add features**: Discord notifications, custom alerts, etc.

---

## Tips for Success

✅ **Do:**
- Start with high-confidence edges (85%+)
- Track every bet, even small ones
- Review your results weekly
- Focus on edge types that hit most for you
- Manage your bankroll (never bet more than 2-3% per bet)

❌ **Don't:**
- Chase losses with bigger bets
- Ignore your tracking (you need data!)
- Expect guaranteed wins (edges are probabilistic)
- Bet on everything - be selective
- Overextend your bankroll

---

## Support

**Something not working?**

1. Check README.md for API docs
2. Check DATABASE_SETUP.md for database issues
3. Look at Vercel logs: Project → Deployments → Click deployment → Logs
4. Check GitHub Actions logs: Repo → Actions → Click workflow run

**Have an idea for a feature?**

1. GitHub Issues - describe your idea
2. Pull requests welcome!

---

## Remember

🎯 **This is a tool for finding edges, not a guarantee.**

📊 **The system identifies opportunities the market hasn't priced correctly.**

💰 **Bet smart, manage risk, track results.**

🚀 **You're now running a professional-grade edge detection system.**

---

**Enjoy and good luck!** 🍀

For more details, see:
- README.md - Full documentation
- DATABASE_SETUP.md - Database configuration
- Each backend file has detailed comments

---

**Made by TheRealYazzy** - Built for serious bettors who want an edge. ✅
