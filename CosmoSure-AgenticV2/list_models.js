const apiKey = process.argv[2];

if (!apiKey) {
    console.error("Please provide your Gemini API key as an argument.");
    console.error("Usage: node list_models.js YOUR_API_KEY");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        const validModels = data.models.filter(m => 
            m.supportedGenerationMethods && 
            m.supportedGenerationMethods.includes("generateContent")
        );

        console.log("\n--- Models Supporting generateContent ---\n");
        validModels.forEach(m => {
            console.log(`Model ID: ${m.name.replace('models/', '')}`);
            console.log(`Display Name: ${m.displayName}`);
            console.log(`Description: ${m.description}`);
            console.log("-----------------------------------------");
        });
    })
    .catch(err => console.error("Network Error:", err));
