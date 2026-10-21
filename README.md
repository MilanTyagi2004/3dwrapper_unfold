<div align="center">

# ⚡ DEMONIC FUEL
### *Energy for the Obsessed.*

[![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![R3F](https://img.shields.io/badge/React_Three_Fiber-9.7-white?style=for-the-badge)](https://r3f.docs.pmnd.rs/)
[![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02?style=for-the-badge&logo=greensock)](https://gsap.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

<p align="center">
  A fast-dissolving, zero-sugar, 45mg natural caffeine oral strip web experience.<br/>
  Featuring cinematic 3D product unfolds, liquid typography displacement, interactive founder allocation pass, and buttery-smooth 120 FPS performance.
</p>

[Quick Start](#-quick-start-guide) • [Step-by-Step Setup](#-step-by-step-setup) • [Admin Portal](#-admin-portal-setup) • [Supabase Database](#-supabase-database-setup) • [Features](#-key-features) • [Troubleshooting](#-troubleshooting)

---

</div>

## 🌌 Overview

**Demonic Fuel** is built for the unreasonably ambitious — creators, founders, athletes, gamers, and obsessives who refuse to operate on autopilot. When you need to summon energy and lock the fuck in, the ceremony of brewing coffee or chugging a 500ml canned energy drink is unnecessary friction. 

**Tear. Tongue. Dissolve. Go.**

This repository contains the complete full-stack web flagship, including:
1. **The Main Flagship Storefront**: Interactive 3D product stage, kinetic cursor, liquid typography, and founder pass allocation generator.
2. **Local Serverless API**: Built-in Vite middleware executing `/api/*` endpoints locally without needing external serverless CLI tooling.
3. **Demonic Admin Portal**: Dedicated private portal for managing leads, founder passes, and waitlist allocations.
4. **Supabase Database Schema**: Lockdown RLS scripts and automated indexes.

---

## ⚡ Quick Start Guide

If you already have Node.js and Git installed, run these 4 commands to get up and running:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/3dwrapper_unfold.git
cd 3dwrapper_unfold

# 2. Install dependencies
npm install

# 3. Create your environment file (copy example or create .env)
# Add your Supabase credentials in .env

# 4. Start the development server
npm run dev
```

The site will be live at **`http://localhost:5173`**.

---

## 📋 Prerequisites & System Requirements

Before you begin, ensure your local environment meets the following requirements:

- **Node.js**: `v18.0.0` or higher (`v20.x` or `v22.x` recommended). Verify with:
  ```bash
  node -v
  ```
- **npm**: `v9.0.0` or higher (comes with Node.js). Verify with:
  ```bash
  npm -v
  ```
- **Git**: Installed and configured on your machine.
- **Hardware**: A modern GPU or integrated graphics capable of WebGL 2.0 (Three.js hardware acceleration).

---

## 🚀 Step-by-Step Setup

Follow these detailed steps to set up the project from scratch.

### Step 1: Clone the Repository
Open your terminal (PowerShell, Command Prompt, or Bash) and clone the repository:
```bash
git clone https://github.com/your-username/3dwrapper_unfold.git
cd 3dwrapper_unfold
```

---

### Step 2: Install Root Dependencies
Install all required packages for the main flagship storefront:
```bash
npm install
```
> [!NOTE]
> This installs React 19, Vite, Three.js, React Three Fiber, Drei, GSAP, Framer Motion, QR Code Canvas, and Oxlint.

---

### Step 3: Environment Variables Setup (`.env`)
Create a file named `.env` in the root directory (`3dwrapper_unfold/.env`):

```env
# ─────────────────────────────────────────────────────────────────────
# SERVER-ONLY SECRETS: Used by /api functions (and the local dev server).
# NO "VITE_" prefix → Vite never exposes these to the browser client bundle.
# ─────────────────────────────────────────────────────────────────────

# 1. Your Supabase project URL
SUPABASE_URL=https://your-project-id.supabase.co

# 2. Your Supabase Service Role Secret Key (sb_secret_...)
SUPABASE_SECRET_KEY=sb_secret_your_secret_key_here
```

> [!IMPORTANT]
> **Why no `VITE_` prefix?**  
> Security by design. The browser **never** talks directly to the database. All read and write operations go through the serverless `/api` endpoints using the secret service key. Vite will never bundle these variables into the frontend.

---

### Step 4: Run the Local Development Server
Start Vite with hot module replacement (HMR) and local API serverless middleware:
```bash
npm run dev
```

The terminal will display:
```text
  VITE v8.3.0  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open **`http://localhost:5173/`** in your browser.

> [!TIP]
> **How local `/api` routes work**:  
> You do **not** need to install or run the Vercel CLI locally! The custom `devApi()` plugin in [`vite.config.js`](file:///e:/3d%20wrapper/3dwrapper_unfold/vite.config.js) automatically executes files in `/api/*.js` inside `npm run dev`, perfectly matching the production Vercel serverless environment.

---

### Step 5: Production Build & Testing
To test the production build locally and verify that chunking, minification, and asset paths are valid:

```bash
# 1. Compile the production bundle
npm run build

# 2. Preview the production build locally
npm run preview
```
The preview server will start (typically at `http://localhost:4173/`).

---

## 🗄 Supabase Database Setup

To enable lead capture, founder card issuance, and duplicate rejection:

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Create a new project (e.g., `demonic-fuel`).
3. Note down your **Project URL** and **Service Role (Secret) Key** from **Project Settings ➔ API Keys**.

### 2. Run the Security & Lockdown SQL
1. Open the **SQL Editor** in your Supabase dashboard.
2. Open [`supabase/secure_admin.sql`](file:///e:/3d%20wrapper/3dwrapper_unfold/supabase/secure_admin.sql) from this repository.
3. Paste the contents into the SQL Editor and click **Run**.

This script automatically:
- Creates the `admin_users`, `founder_passes`, and `newsletter_subscribers` tables.
- Enables **Row Level Security (RLS)** on all tables.
- Revokes all permissions from `anon` and `authenticated` roles (public clients get 0 direct access).
- Creates a case-insensitive unique constraint on `lower(email)` in `founder_passes` to reject duplicates with an HTTP `409 Conflict`.

---

## 🛡 Admin Portal Setup (`demonic-admin-portal`)

The project includes an isolated private admin portal located in `demonic-admin-portal/` for viewing registered members and waitlist metrics.

### Step 1: Open the Admin Directory
In a new terminal window:
```bash
cd demonic-admin-portal
```

### Step 2: Install Admin Dependencies
```bash
npm install
```

### Step 3: Configure Admin Environment
Create a `.env` file in `demonic-admin-portal/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_secret_key_here
```

### Step 4: Run the Admin Portal
```bash
npm run dev
```
The portal will launch on its own port (e.g., **`http://localhost:5174`**).

### Step 5: Add an Admin User
1. In your Supabase Dashboard, go to **Authentication ➔ Users ➔ "Add user"**.
2. Create an admin email and password (check *"Auto confirm user"*).
3. In the Supabase SQL editor, grant admin privileges:
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'your-admin-email@example.com';
   ```
4. Now log in at `http://localhost:5174/` with those credentials.

---

## ✨ Key Features & Architecture

| Component | File Path | Key Mechanics |
| :--- | :--- | :--- |
| **3D Storytelling Stage** | [`src/components/DemonicStrips.jsx`](file:///e:/3d%20wrapper/3dwrapper_unfold/src/components/DemonicStrips.jsx) | 5-stage cinematic product unfold (Unpack, Dispense, Peel, Emerge, Dissolve) powered by R3F + GSAP. Throttles to `frameloop="never"` when offscreen. |
| **Liquid Typography** | [`src/components/LiquidHeadline.jsx`](file:///e:/3d%20wrapper/3dwrapper_unfold/src/components/LiquidHeadline.jsx) | Fluid water displacement responding to mouse velocity. Features cached bounding rects and an autonomous sleep engine to prevent layout thrashing. |
| **Founder Pass** | [`src/components/founder card/EmailCollect.jsx`](file:///e:/3d%20wrapper/3dwrapper_unfold/src/components/founder%20card/EmailCollect.jsx) | Luxury titanium 3D card tilt, QR generator, procedural IDs, and 4X Ultra-HD canvas image export. |
| **Smooth FAQ** | [`src/components/FaqSection.jsx`](file:///e:/3d%20wrapper/3dwrapper_unfold/src/components/FaqSection.jsx) | High-performance accordion using measured `scrollHeight` height transitions, paint containment, and memoized items for 120 FPS glide. |
| **Kinetic Cursor** | [`src/components/CustomCursor.jsx`](file:///e:/3d%20wrapper/3dwrapper_unfold/src/components/CustomCursor.jsx) | Hardware-accelerated 3-layer inertial cursor with state-gated DOM updates. |
| **Hero Dual Video** | [`src/components/HeroSection.jsx`](file:///e:/3d%20wrapper/3dwrapper_unfold/src/components/HeroSection.jsx) | Seamless crossfading video background with ambient audio unlocking on first user interaction. |

---

## 🛠 Available Scripts

In the project root, you can run:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server on port `5173` with local API routes enabled |
| `npm run build` | Compiles production assets into the `dist/` directory |
| `npm run preview` | Starts a local web server serving the production `dist/` build |
| `npm run lint` | Runs [Oxlint](https://oxc.rs/) for ultra-fast Rust-based static code analysis |

---

## 🚢 Deploying to Vercel

This repository is pre-configured for one-click deployment on [Vercel](https://vercel.com):

1. Push your code to GitHub / GitLab.
2. Import the project into Vercel.
3. In **Settings ➔ Environment Variables**, add:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SECRET_KEY`: Your Supabase Service Secret Key
4. Click **Deploy**.

Vercel automatically detects [`vercel.json`](file:///e:/3d%20wrapper/3dwrapper_unfold/vercel.json), bundles the frontend, and deploys the `/api` files as Serverless Functions with zero configuration.

---

## 🔧 Troubleshooting

### 1. Port 5173 is already in use
If another process or instance is occupying port 5173:
```bash
# Vite will automatically switch to 5174, or you can force a port:
npx vite --port 3000
```

### 2. API calls return `500` or Network Errors
- Ensure your `.env` file exists in the root folder (not inside `src/`).
- Verify that `SUPABASE_URL` begins with `https://` and `SUPABASE_SECRET_KEY` starts with `sb_secret_` (or service role key).
- Make sure you restarted `npm run dev` after changing `.env`.

### 3. Duplicate Email Error (`409 Conflict`)
If you try to register a Founder Pass with an email that already exists:
- The backend will reject it by design with `ACCESS PASS ALREADY ISSUED`.
- Click the **"Already registered? Retrieve your pass"** link on the card form to look up your existing pass with your email and phone number.

### 4. 3D Canvas / WebGL Warnings in Dev
- If the browser says WebGL context was lost, simply refresh the tab.
- R3F canvas automatically pauses when out of view (`frameloop="never"`) to conserve memory and GPU resources.

---

## 📄 License

Private & Proprietary. © 2026 Demonic Fuel. All rights reserved.  
Unauthorised copying, reproduction, or distribution is strictly prohibited.
