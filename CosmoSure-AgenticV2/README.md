# CosmoSure: The Luxury Skincare Expert

CosmoSure is a premium, AI-powered Chrome Extension designed to serve as your personal, world-class skincare and cosmetics curator. Built with a luxurious aesthetic and powered by the Google Gemini API, it provides deep product insights, chemical analyses, and interactive discovery loops—all within a beautiful, full-page tab experience.

## ✨ Key Features

*   **Cinematic Landing Experience:** Greeted by floating ambient light orbs, cycling scientifically-backed skincare facts, and elegant typography, the extension feels like a high-end luxury storefront.
*   **Intelligent Autocomplete:** As you type, CosmoSure predicts and suggests the exact skincare or cosmetic product you are looking for.
*   **Deep AI Analysis:** Powered by `gemini-3.1-flash-lite-preview`, the app breaks down any product to provide a clear summary, its targeted skin concerns, and its main chemical ingredients.
*   **Interactive Discovery Engine:** The generated ingredients (e.g., *Niacinamide*) and concerns (e.g., *Dryness*) are fully interactive. Clicking any tag instantly queries the AI for 5 other products that share that ingredient or solve that concern.
*   **Hybrid Purchase Links:** Purchase links dynamically route to the most reliable source. The AI attempts to provide the official brand URL; if unsure, it gracefully falls back to generating a highly reliable Google Shopping Search link to ensure you never hit a 404 error.
*   **Premium Aesthetics:** Features a pristine Ivory and Champagne Gold color palette, silky smooth CSS animations, and the highly readable `Outfit` font for a modern, editorial vibe.

## 🚀 Installation & Setup

1.  **Clone or Download** this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **"Developer mode"** in the top right corner.
4.  Click **"Load unpacked"** and select the `CosmoSure` directory.
5.  Pin the CosmoSure icon to your browser toolbar.
6.  **API Key Setup:** 
    *   Click the CosmoSure icon.
    *   You will be prompted to enter your **Google Gemini API Key**.
    *   Your key is stored securely in your browser's local storage (`chrome.storage.local`).

## 🛠️ Architecture Overview

CosmoSure has been engineered as a **Full-Page Extension**:
*   `manifest.json`: Configured as a Manifest V3 extension utilizing a `service_worker`.
*   `background.js`: Listens for the extension icon click and dynamically opens `index.html` in a new, persistent Chrome tab (preventing the app from closing when external links are clicked).
*   `index.html` & `index.css`: The core UI, featuring a split-grid layout (Sidebar for discovery, Main Area for analysis) and the luxury styling system.
*   `index.js`: Handles DOM manipulation, event listeners, the facts ticker, and hybrid link routing logic.
*   `gemini_api.js`: A dedicated wrapper class that interfaces with the Google Generative Language REST API, explicitly configured to enforce structured JSON output.

## 🔒 Privacy & Security

CosmoSure does not use an external backend to store your data. Your Gemini API key is saved directly to your local Chrome profile and is only transmitted directly to Google's API endpoints.

## 🔮 Future Roadmap (Agentic Implementation)

The next phase of development will transform CosmoSure from a prompt-response application into an **Autonomous Agent**. It will utilize multi-step reasoning loops, custom execution tools (like live database searches and pricing lookups), and a transparent UI console that displays the AI's internal thought process to the user.
