# ✦ CosmoSure Agent V3: The Autonomous Skincare Architect

CosmoSure is a premium, world-class AI agent designed for the skincare connoisseur. Unlike traditional apps, CosmoSure is a **fully autonomous agentic system** that doesn't just search—it reasons. Powered by Google's `gemini-3.1-flash-lite-preview`, it executes multi-step logic to curate the perfect regimen, analyze complex chemistry, and find the best value across the global market.


## ✨ The Agentic Advantage

CosmoSure utilizes a **Manual Agentic Loop** (inspired by advanced LLM reasoning patterns). When you ask a question, the agent:
1.  **Observes** your skin concern or product query.
2.  **Reasons** about what information is missing.
3.  **Executes** specialized tools (Web Search, Molecular Analysis, Price Lookup) in an iterative chain.
4.  **Refines** its findings until it reaches a scientifically-backed conclusion.

### 🌐 Deep Web Intelligence
Our `searchWeb` tool scours the digital landscape. It doesn't rely on static databases; it finds real-time product releases, trending formulations, and authentic user sentiment from across the web.

### 🧪 Molecular Chemistry Analysis
The `getIngredientAnalysis` tool acts as your personal cosmetic chemist. It breaks down complex INCI lists into clear, science-backed insights on benefits, usage frequency, and potential contraindications.

### 🏷️ Retailer & Value Lookup
The `checkRetailPricing` tool identifies major retailers (Amazon, Sephora, Ulta, etc.), estimates price tiers, and provides **direct clickable links** so you can go from discovery to doorstep in seconds.

---

## 🎨 Premium Design Aesthetics

*   **Science-First Landing Page:** A curated dashboard featuring real-time skin science facts and interactive tool visualizations.
*   **Reasoning Transparency:** Watch the agent's "Thought Process" in real-time. View the raw JSON decisions or switch to **✨ Clean View** for a polished summary of each step.
*   **Pastel Editorial UI:** A sophisticated palette of Midnight Plum, Lavender Blush, and Soft Mint, paired with **Poppins** and **DM Sans** for a high-end magazine feel.

---

## 🚀 Getting Started

1.  **Installation**: Load the `CosmoSure-AgenticV2` folder as an "Unpacked Extension" in `chrome://extensions`.
2.  **API Key**: Enter your Google Gemini API Key in the settings overlay. Your key stays 100% private in `chrome.storage.local`.
3.  **Deploy the Agent**: Type your query (e.g., *"Find a retinol for sensitive skin, analyze the ingredients, and tell me where to buy it"*) and watch the reasoning chain unfold.

## 🛠️ Technical Stack

-   **Core**: Manifest V3, JavaScript (ES6+), HTML5.
-   **Styling**: Vanilla CSS with a custom Pastel Token System.
-   **AI**: Google Gemini API (`gemini-3.1-flash-lite-preview`).
-   **Markdown**: Rendered via local `marked.js` for CSP-compliant rich text reports.

---

*“Skin is a reflection of your science. Optimize it with CosmoSure.”*
