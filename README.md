# 🏆 TheSportsDB WYSIWYG Graphic & Lineup Editor

A powerful, client-side visual WYSIWYG editor and graphic creator for sports content. Fetch live teams, players, league standings, match schedules, and scoreboards directly from **TheSportsDB API** and layout beautiful graphics, lineups, cards, and match templates on a highly interactive, drag-and-drop workspace canvas. Export your designs as high-fidelity PNG graphics in one click!

Developed with a clean, high-contrast visual identity using React, Tailwind CSS, and Framer Motion.

---

## ✨ Features

- 🎨 **Visual WYSIWYG Canvas Editor**: Drag, resize, rotate, and customize text boxes, cards, badges, and player cutouts on an interactive grid workspace.
- 🏟️ **Custom Field & Theme Templates**: Change background canvases to reflect different sports (Soccer pitch, Basketball court, Ice Hockey rink, Neon modern charts, Minimalist boards, and custom image uploads).
- 🔄 **Direct TheSportsDB Integration**:
  - **Teams**: Search any team globally, fetch high-quality badge PNGs, stadium pictures, and team profiles.
  - **Players**: Lookup player rosters with high-res cutouts, profiles, or squad positions.
  - **Leagues**: Fetch live League Standing Tables (e.g., Premier League, La Liga, NBA, NFL) and render them directly onto cards.
  - **Events & Fixtures**: Fetch upcoming match fixtures or past match results and format them in beautiful scoreboard layouts.
- 📐 **Template Presets**: Quick-load predefined standard layout designs:
  - **Match Day Scoreboard**: Custom home/away matchup banners.
  - **League Standings Board**: Standings tables dynamically filled with team crests.
  - **Tactical Pitch Lineup**: 11-player and 5-player pitch alignments.
  - **Player Spotlight Card**: Visually styled cards with player cutouts and stats.
- 🔑 **Redundant API Key Cycling**: Automatically cycles through multiple fallback free API keys to bypass rate limits, or allows you to enter your custom premium TheSportsDB API key for full roster lookups.
- 💾 **Local Work Persistence**: Automatically saves your current workspace state and custom templates to `localStorage` so you never lose your progress.
- 📤 **High-Fidelity Export**: Export the complete styled canvas to a clean, watermark-free PNG file. Supports advanced CORS bypassing to render remote image badges without staining the canvas.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (v9 or higher)

### Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd <your-repository-name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Production Build & Standalone Start

To compile and bundle both the Express API proxy and React static assets for production:

```bash
# Compile and bundle code
npm run build

# Start the full-stack server
npm run start
```

---

## 🛠️ GitHub Actions Deployment (GitHub Pages)

This project is pre-configured with a continuous integration (CI) workflow to deploy your application to **GitHub Pages** as a fully client-side static site!

### How to Activate GitHub Pages

1. Push your code repository to **GitHub**.
2. Go to your repository settings page: **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The deployment workflow in `.github/workflows/deploy.yml` will automatically trigger on every push to the `main` branch, build your Vite app, and publish it online!

### 🌍 Seamless Client-Side / Full-Stack Failover
To support both **Full-Stack hosting** (which uses an Express server to proxy and bypass CORS) and **Serverless hosting** (like GitHub Pages), the application automatically detects its host environment:
- **Serverless/GitHub Pages Mode**: Automatically makes direct CORS-friendly calls to TheSportsDB API and routes remote images through `images.weserv.nl` (a secure, high-performance image proxy/CDN) to keep `html2canvas` running securely without cross-origin tainting.
- **Full-Stack Mode**: Uses the integrated local Express API routes (`/api/tsdb/*` and `/api/tsdb-media`) to optimize requests and buffer images.

---

## 📦 Tech Stack

- **Frontend Core**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Bundler**: [Vite](https://vite.dev/)
- **Animations**: [Framer Motion / Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Canvas Rendering**: [html2canvas](https://html2canvas.hertzen.com/)
- **Backend API Engine**: [Express](https://expressjs.com/) (used in full-stack mode)

---

## 📝 License

This project is open-source and licensed under the [MIT License](LICENSE).
