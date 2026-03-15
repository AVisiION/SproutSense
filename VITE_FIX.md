# Vite Error Fix Guide

## Error: `Unknown option -L`

### Problem
You encountered: `CACError: Unknown option \`-L\``

This happens when using an invalid Vite CLI flag.

### Cause
The `-L` flag is **not a valid Vite option**.

### Solution

**Use the correct npm scripts from package.json:**

```bash
# ✅ CORRECT - Start dev server
npm run dev

# ❌ WRONG - Don't use manual vite commands with invalid flags
vite --mode development -L
```

## Valid Vite Commands

```bash
# Development
npm run dev          # Starts on http://localhost:5173

# Production Build
npm run build        # Build for production
npm run preview      # Preview production build

# Custom port
vite --port 3000

# Open browser
vite --open
```

## Development Workflow

### 1. Start Backend (Terminal 1)
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

### 2. Start Frontend (Terminal 2)
```bash
cd web
npm run dev
# Runs on http://localhost:5173
```

### 3. Access Dashboard
Open: `http://localhost:5173`

## Environment Variables

**Frontend: `web/.env.development`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

**Backend: `server/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
```

✅ **Fixed!** Use `npm run dev` in the `web/` directory.
