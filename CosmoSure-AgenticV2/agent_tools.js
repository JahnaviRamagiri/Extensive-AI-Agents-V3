/**
 * CosmoSure Agent V3 — Tool Functions (Gemini-only, zero mock data)
 *
 * All three tools make focused Gemini sub-calls with specific prompts.
 * No hardcoded data. No external APIs. Only the user's Gemini API key.
 *
 * 1. searchWeb(query)              → Gemini reasons about products/brands on the web
 * 2. getIngredientAnalysis(name)   → Gemini provides science-backed ingredient breakdown
 * 3. checkRetailPricing(product)   → Gemini reasons about price ranges & retailers
 */

export const TOOL_DESCRIPTIONS = `
1. searchWeb(query: string) -> object
   Searches for real skincare products, brands, or topics matching the query.
   Returns product names, descriptions, and relevant details.
   Examples: searchWeb("best vitamin C serum for dullness"), searchWeb("affordable moisturizer for dry skin")

2. getIngredientAnalysis(ingredientName: string) -> object
   Returns a detailed scientific breakdown of a skincare ingredient:
   type, benefits, target concerns, usage instructions, and cautions.
   Examples: getIngredientAnalysis("Niacinamide"), getIngredientAnalysis("Retinol")

3. checkRetailPricing(productName: string) -> object
   Returns the approximate price range and major retailers for a skincare product.
   Examples: checkRetailPricing("The Ordinary Niacinamide 10%"), checkRetailPricing("CeraVe Moisturizing Cream")
`;

// ─── Tool Factory ─────────────────────────────────────────────────────────────
export function createToolFunctions(apiKey) {
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;

    async function callGemini(prompt) {
        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message || res.statusText);
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response.";
    }

    return {

        /**
         * Tool 1: searchWeb
         * Gemini reasons about real skincare products matching the query,
         * drawing on its broad knowledge of brands, formulations, and reviews.
         */
        searchWeb: async (args) => {
            const query = (args.query || "").trim();
            if (!query) return { error: "No query provided." };
            try {
                const prompt = `You are a skincare product expert with knowledge of real brands and products available on the market.

Search query: "${query}"

List 3-5 real skincare products that best match this query. For each product include:
- Product name (exact brand + product name)
- Brand
- Product type (serum, cleanser, moisturizer, etc.)
- Key ingredients
- Why it matches the query (1 sentence)

Format as a numbered list. Be factual — only name products that actually exist.`;
                const result = await callGemini(prompt);
                return { query, results: result };
            } catch (err) {
                return { error: `Search failed: ${err.message}` };
            }
        },

        /**
         * Tool 2: getIngredientAnalysis
         * Gemini provides a science-backed analysis of the ingredient.
         */
        getIngredientAnalysis: async (args) => {
            const ingredient = (args.ingredientName || "").trim();
            if (!ingredient) return { error: "No ingredient name provided." };
            try {
                const prompt = `You are a cosmetic chemist. Provide a concise, factual analysis of "${ingredient}" as a skincare ingredient.

TYPE: (humectant / exfoliant / antioxidant / retinoid / etc.)
BENEFITS: (what it does for the skin)
BEST FOR: (skin concerns it targets)
HOW TO USE: (AM/PM, frequency, layering tips)
CAUTIONS: (warnings, interactions, who should avoid it)

Keep each section to 1–2 sentences. Be scientifically accurate.`;
                const analysis = await callGemini(prompt);
                return { ingredient, analysis };
            } catch (err) {
                return { error: `Ingredient analysis failed: ${err.message}` };
            }
        },

        /**
         * Tool 3: checkRetailPricing
         * Gemini reasons about approximate price ranges and major retailers.
         */
        checkRetailPricing: async (args) => {
            const product = (args.productName || "").trim();
            if (!product) return { error: "No product name provided." };
            try {
                const prompt = `You are a skincare retail expert. For the product "${product}":

PRICE RANGE: approximate retail price in USD (e.g. "$8 – $15")
RETAILERS: 3-4 major retailers where it is typically sold (e.g. Amazon, Sephora, Target, Ulta, CVS, Walmart)
VALUE TIER: budget / mid-range / luxury
DISCLAIMER: one sentence noting prices may vary and users should verify current listings.

Be factual based on your knowledge of this product.`;
                const pricing = await callGemini(prompt);
                return { product, pricing };
            } catch (err) {
                return { error: `Pricing lookup failed: ${err.message}` };
            }
        }

    };
}
