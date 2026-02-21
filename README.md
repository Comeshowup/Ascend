# Ascend Core

A production-ready Discord bot for the Ascend server — focus tracking, gamification, AI study assistant, and community management.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Discord Developer Application with Bot token
- OpenAI API key (optional, for `/ai` commands)

### 1. Install Dependencies
```bash
cd ascend-core
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Discord token, MongoDB URI, channel IDs, role IDs, etc.
```

### 3. Register Slash Commands
```bash
npm run register
```

### 4. Start the Bot
```bash
# Development (with ts-node)
npm run dev

# Production
npm run build
npm start
```

## Features

| Feature | Command | Description |
|---------|---------|-------------|
| **Focus Sessions** | `/focus start duration:25` | Start a timed focus session with XP rewards |
| **Cancel Session** | `/focus cancel` | Cancel an active session |
| **Session Status** | `/focus status` | Check remaining time |
| **Profile** | `/stats [user]` | View XP, level, streak, badges |
| **Leaderboard** | `/leaderboard` | Top 10 members by XP |
| **AI Assistant** | `/ai ask question:...` | Ask a study question |
| **Quiz** | `/ai quiz topic:...` | Generate a quiz on any topic |
| **Summarize** | `/ai summarize text:...` | Summarize study material |
| **Timeout** | `/timeout user:... duration:...` | Moderator timeout |

## Architecture

```
src/
├── index.ts          # Bot entry point
├── config/           # Environment + constants
├── commands/         # Slash command handlers
├── events/           # Discord event handlers
├── services/         # Business logic (XP, badges, focus, AI, moderation)
├── models/           # Mongoose schemas (User, FocusSession, WeeklyStats)
├── jobs/             # Cron jobs (weekly report, onboarding reminders)
├── utils/            # Logger, embed builders, cooldowns
└── types/            # TypeScript interfaces
```

## Gamification

- **XP**: 1 XP per minute of focus + 20 bonus per completed session + streak bonus
- **Level**: `floor(0.1 × √xp)`
- **Streaks**: Consecutive daily focus sessions
- **Badges**: 10hr Focus 🔥, Scholar 📚 (50h), Titan ⚡ (100h), Ascend Elite 👑 (500h)

## Deployment (Railway)

1. Push to a Git repository
2. Create a new Railway project and connect the repo
3. Set all environment variables from `.env.example`
4. Set start command: `npm run build && npm start`
5. Deploy

## Environment Variables

See [`.env.example`](.env.example) for the complete list of required and optional variables.
