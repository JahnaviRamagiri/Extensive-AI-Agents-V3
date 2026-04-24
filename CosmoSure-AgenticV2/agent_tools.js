/**
 * CosmoSure Agent Tools
 * These are the 3 custom tool functions the agent can call.
 * The agent uses a manual JSON protocol (no native function calling).
 */

// Tool descriptions injected into the system prompt so the LLM knows what to call
export const TOOL_DESCRIPTIONS = `
1. searchProductDatabase(query: string) -> object
   Searches the CosmoSure internal skincare product database.
   Use this to find products matching a concern, ingredient, or category.
   Examples: searchProductDatabase("vitamin c serum"), searchProductDatabase("moisturizer dry skin")

2. getIngredientAnalysis(ingredientName: string) -> object
   Returns a detailed scientific breakdown of a skincare ingredient:
   benefits, concerns it targets, and any warnings.
   Examples: getIngredientAnalysis("Niacinamide"), getIngredientAnalysis("Hyaluronic Acid")

3. checkRetailPricing(productName: string) -> object
   Looks up the current lowest retail price and official retailer for a product.
   Examples: checkRetailPricing("CeraVe Hydrating Facial Cleanser")
`;

// ─── Mock Product Database ───────────────────────────────────────────────────
const mockProducts = [
    {
        name: "CeraVe Hydrating Facial Cleanser",
        type: "cleanser",
        brand: "CeraVe",
        tags: ["dryness", "ceramides", "hyaluronic acid", "gentle", "sensitive skin"],
        rating: 4.7,
        keyIngredients: ["Ceramides", "Hyaluronic Acid", "Niacinamide"]
    },
    {
        name: "Paula's Choice 2% BHA Liquid Exfoliant",
        type: "exfoliant",
        brand: "Paula's Choice",
        tags: ["acne", "salicylic acid", "bha", "dullness", "blackheads", "pores"],
        rating: 4.8,
        keyIngredients: ["Salicylic Acid (2%)"]
    },
    {
        name: "The Ordinary Niacinamide 10% + Zinc 1%",
        type: "serum",
        brand: "The Ordinary",
        tags: ["acne", "niacinamide", "oiliness", "pores", "redness", "blemishes"],
        rating: 4.5,
        keyIngredients: ["Niacinamide", "Zinc PCA"]
    },
    {
        name: "La Roche-Posay Toleriane Double Repair Face Moisturizer",
        type: "moisturizer",
        brand: "La Roche-Posay",
        tags: ["dryness", "ceramides", "niacinamide", "sensitive skin", "repair"],
        rating: 4.6,
        keyIngredients: ["Ceramides", "Niacinamide", "Glycerin"]
    },
    {
        name: "TruSkin Vitamin C Serum",
        type: "serum",
        brand: "TruSkin",
        tags: ["dullness", "vitamin c", "aging", "brightening", "dark spots", "glow"],
        rating: 4.4,
        keyIngredients: ["Vitamin C (L-Ascorbic Acid)", "Hyaluronic Acid", "Vitamin E"]
    },
    {
        name: "Neutrogena Hydro Boost Water Gel",
        type: "moisturizer",
        brand: "Neutrogena",
        tags: ["hydration", "hyaluronic acid", "oily skin", "lightweight", "gel"],
        rating: 4.5,
        keyIngredients: ["Hyaluronic Acid"]
    },
    {
        name: "Cetaphil Gentle Skin Cleanser",
        type: "cleanser",
        brand: "Cetaphil",
        tags: ["sensitive skin", "gentle", "dryness", "fragrance-free", "dermatologist recommended"],
        rating: 4.6,
        keyIngredients: ["Glycerin", "Niacinamide"]
    },
    {
        name: "Drunk Elephant C-Firma Fresh Day Serum",
        type: "serum",
        brand: "Drunk Elephant",
        tags: ["vitamin c", "brightening", "aging", "antioxidant", "luxury", "dullness"],
        rating: 4.3,
        keyIngredients: ["Vitamin C (15%)", "Ferulic Acid", "Vitamin E"]
    }
];

// ─── Mock Ingredient Database ─────────────────────────────────────────────────
const mockIngredients = {
    "hyaluronic acid": {
        type: "Humectant",
        benefits: "A powerful humectant that attracts and holds up to 1000x its weight in water. Plumps skin, reduces fine lines, and improves texture.",
        bestFor: ["Dryness", "Dehydration", "Fine Lines"],
        cautions: "Works best in humid environments; in dry climates, seal with an occlusive moisturizer.",
        frequency: "Can be used AM and PM daily."
    },
    "niacinamide": {
        type: "Vitamin B3 / Multi-functional",
        benefits: "Regulates sebum production, visibly minimizes pores, reduces redness and inflammation, and strengthens the skin barrier. Also brightens dark spots.",
        bestFor: ["Acne", "Oiliness", "Redness", "Enlarged Pores", "Uneven Skin Tone"],
        cautions: "Generally well-tolerated by all skin types. Avoid combining with high-concentration Vitamin C as it may cause flushing.",
        frequency: "Ideal AM and PM use."
    },
    "salicylic acid": {
        type: "Beta Hydroxy Acid (BHA)",
        benefits: "Oil-soluble acid that penetrates deep into pores to dissolve dead skin cells, sebum, and debris. Prevents and treats blackheads and acne.",
        bestFor: ["Acne", "Blackheads", "Oiliness", "Dullness", "Clogged Pores"],
        cautions: "Can be drying. Start 2-3x per week. Avoid during pregnancy. Always use sunscreen.",
        frequency: "2-3x per week to daily depending on skin tolerance."
    },
    "vitamin c": {
        type: "Antioxidant / Brightener",
        benefits: "Potent antioxidant that neutralizes free radicals, boosts collagen synthesis, fades dark spots, and provides UV damage protection when paired with SPF.",
        bestFor: ["Dullness", "Aging", "Dark Spots", "Uneven Skin Tone", "Anti-oxidant protection"],
        cautions: "Unstable in light and air; store in dark bottles. Can sting on sensitive or active breakout skin. Use AM before SPF.",
        frequency: "AM daily for maximum antioxidant protection."
    },
    "ceramides": {
        type: "Skin Barrier Lipid",
        benefits: "Naturally occurring lipids that make up ~50% of the skin barrier. Prevent transepidermal water loss, lock in moisture, and protect against environmental stressors.",
        bestFor: ["Dryness", "Damaged Barrier", "Sensitive Skin", "Eczema-prone skin"],
        cautions: "No known side effects. Excellent for all skin types including sensitive.",
        frequency: "AM and PM, great as a moisturizer base."
    },
    "retinol": {
        type: "Retinoid / Vitamin A Derivative",
        benefits: "Gold-standard anti-aging ingredient. Accelerates cell turnover, stimulates collagen, reduces fine lines, fades hyperpigmentation, and unclogs pores.",
        bestFor: ["Aging", "Wrinkles", "Hyperpigmentation", "Acne", "Dullness"],
        cautions: "Start low (0.025%) and slow (1-2x/week). Causes initial purging. NEVER use during pregnancy. Always pair with SPF.",
        frequency: "PM only, 1-2x per week initially, building to nightly."
    },
    "glycerin": {
        type: "Humectant",
        benefits: "A gentle, classic humectant that draws water to the skin surface. Helps maintain moisture balance and supports a healthy microbiome.",
        bestFor: ["Dryness", "Sensitive Skin", "Dehydration"],
        cautions: "Extremely gentle; suitable for all skin types including babies.",
        frequency: "AM and PM daily."
    }
};

// ─── Mock Pricing Database ────────────────────────────────────────────────────
const mockPricing = {
    "CeraVe Hydrating Facial Cleanser": { price: 15.99, retailer: "Ulta Beauty", inStock: true, url: "ulta.com" },
    "Paula's Choice 2% BHA Liquid Exfoliant": { price: 35.00, retailer: "Paula's Choice Official", inStock: true, url: "paulaschoice.com" },
    "The Ordinary Niacinamide 10% + Zinc 1%": { price: 6.50, retailer: "Sephora", inStock: true, url: "sephora.com" },
    "La Roche-Posay Toleriane Double Repair Face Moisturizer": { price: 23.99, retailer: "Target", inStock: true, url: "target.com" },
    "TruSkin Vitamin C Serum": { price: 19.99, retailer: "Amazon", inStock: true, url: "amazon.com" },
    "Neutrogena Hydro Boost Water Gel": { price: 22.97, retailer: "Walmart", inStock: true, url: "walmart.com" },
    "Cetaphil Gentle Skin Cleanser": { price: 14.99, retailer: "CVS Pharmacy", inStock: true, url: "cvs.com" },
    "Drunk Elephant C-Firma Fresh Day Serum": { price: 90.00, retailer: "Sephora", inStock: true, url: "sephora.com" }
};

// ─── Tool Functions (called by the agent loop) ────────────────────────────────
export const toolFunctions = {
    searchProductDatabase: (args) => {
        const query = (args.query || "").toLowerCase();
        const results = mockProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.type.includes(query) ||
            p.brand.toLowerCase().includes(query) ||
            p.tags.some(tag => query.includes(tag) || tag.includes(query))
        );

        if (results.length === 0) {
            return { found: false, message: "No products found matching your query in the CosmoSure database." };
        }
        return {
            found: true,
            count: results.length,
            products: results.map(p => ({
                name: p.name,
                type: p.type,
                brand: p.brand,
                rating: p.rating,
                keyIngredients: p.keyIngredients,
                bestFor: p.tags.slice(0, 3)
            }))
        };
    },

    getIngredientAnalysis: (args) => {
        const name = (args.ingredientName || "").toLowerCase().trim();
        for (const [key, value] of Object.entries(mockIngredients)) {
            if (name.includes(key) || key.includes(name)) {
                return { found: true, ingredient: key, analysis: value };
            }
        }
        return {
            found: false,
            message: `Scientific analysis not available for "${args.ingredientName}" in our current database. Common ingredients include: Hyaluronic Acid, Niacinamide, Salicylic Acid, Vitamin C, Ceramides, Retinol, Glycerin.`
        };
    },

    checkRetailPricing: (args) => {
        const name = (args.productName || "");
        for (const [key, value] of Object.entries(mockPricing)) {
            if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
                return { found: true, product: key, pricing: value };
            }
        }
        return {
            found: false,
            message: `Pricing data not available for "${args.productName}". Try using the exact product name as returned by searchProductDatabase.`
        };
    }
};
