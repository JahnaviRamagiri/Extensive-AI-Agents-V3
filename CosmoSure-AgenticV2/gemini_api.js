import { TOOL_DESCRIPTIONS, createToolFunctions } from './agent_tools.js';

/**
 * CosmoSure Agentic Gemini API
 *
 * Implements the MANUAL agentic loop from 10_full_agent.py:
 *   Query → LLM → Tool Call → Tool Result → Query → LLM → ... → Final Answer
 *
 * Key principles:
 * - LLM is instructed to respond ONLY in JSON: {"tool_name": ..., "tool_arguments": ...} OR {"answer": ...}
 * - Every iteration, ALL past messages are concatenated into a single text prompt
 * - Tool functions are executed locally in JavaScript
 * - Progress events stream each step to the UI in real-time
 */

const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

// ─── System Prompt ────────────────────────────────────────────────────────────
// This turns the LLM into an agent — mirrors the system_prompt in 10_full_agent.py
const SYSTEM_PROMPT = `You are CosmoSure Agent V3, an elite autonomous AI skincare agent. Your job is to answer the user's query accurately by reasoning step-by-step and using your tools.

You have access to the following tools:
${TOOL_DESCRIPTIONS}

You must respond in ONE of these two JSON formats ONLY:

If you need to use a tool:
{"tool_name": "<name>", "tool_arguments": {"<arg_name>": "<value>"}}

If you have gathered enough information and are ready to give the final answer:
{"answer": "<your beautifully formatted final answer in Markdown>"}

IMPORTANT RULES:
- Respond with ONLY the JSON. No other text. No markdown code fences.
- ALWAYS use tools to gather real data before answering — searchWeb first, then analyze ingredient, then check price.
- After receiving a tool result, either call another tool (if more info is needed) or provide your final answer.
- Your final answer should be a comprehensive, professionally formatted report.
- Use Markdown features: # for Main Titles, ## for Sections, **bold** for emphasis, *italics* for tips, and bullet points for lists.
- Ideal flow: searchWeb → getIngredientAnalysis → checkRetailPricing → final answer.`;

export class AgenticGeminiAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
        // Create tool functions with API key so they can make Gemini sub-calls
        this.toolFunctions = createToolFunctions(apiKey);
    }

    /**
     * Parse the LLM's response text into a JSON object.
     * Handles markdown code fences and extracts embedded JSON — mirrors parse_llm_response() in 10_full_agent.py.
     */
    _parseResponse(text) {
        let cleaned = text.trim();

        // Strip markdown code fences (```json ... ```)
        if (cleaned.startsWith("```")) {
            const lines = cleaned.split("\n");
            lines.shift(); // remove opening ```
            if (lines[lines.length - 1].trim() === "```") lines.pop(); // remove closing ```
            cleaned = lines.join("\n").trim();
            if (cleaned.startsWith("json")) cleaned = cleaned.slice(4).trim();
        }

        // Try direct parse
        try {
            return JSON.parse(cleaned);
        } catch (_) { /* fall through */ }

        // Try to extract JSON object from surrounding text
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (_) { /* fall through */ }
        }

        throw new Error(`Could not parse LLM response as JSON: ${text.slice(0, 300)}`);
    }

    /**
     * Call the Gemini REST API with a plain text prompt (no function calling).
     * Mirrors call_llm() in 10_full_agent.py.
     */
    async _callLLM(prompt) {
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const msg = errData?.error?.message || response.statusText;
            throw new Error(`Gemini API Error ${response.status}: ${msg}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    /**
     * Build a single text prompt from the full message history.
     * Mirrors the prompt-building loop in run_agent() in 10_full_agent.py:
     *   Each iteration the LLM sees EVERYTHING that happened before.
     */
    _buildPrompt(messages) {
        return messages.map(msg => {
            if (msg.role === "system")   return msg.content;
            if (msg.role === "user")     return `\nUser: ${msg.content}`;
            if (msg.role === "assistant") return `\nAssistant: ${msg.content}`;
            if (msg.role === "tool")     return `\nTool Result: ${msg.content}`;
            return "";
        }).join("\n");
    }

    /**
     * The main agentic loop — mirrors run_agent() in 10_full_agent.py.
     *
     * Pattern:
     *   Query1 → LLM Response → Tool Call → Tool Result
     *   Query2 → LLM Response → Tool Call → Tool Result
     *   Query3 → LLM Response → Final Answer
     *
     * onProgress(event) is called for every step so the UI can render in real-time.
     */
    async runAgentLoop(userQuery, onProgress) {
        const MAX_ITERATIONS = 7;

        // Conversation history — this is the agent's "working memory"
        // Mirrors the messages[] array in 10_full_agent.py
        const messages = [
            { role: "system",  content: SYSTEM_PROMPT },
            { role: "user",    content: userQuery }
        ];

        onProgress({ type: "status", message: "Agent started. Reasoning about your query..." });

        for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
            // Build full prompt from ALL past messages (the key agentic loop mechanic)
            const prompt = this._buildPrompt(messages);

            // Emit iteration event WITH the full prompt so the UI can show it
            onProgress({ type: "iteration", iteration, prompt });

            // Call the LLM
            let rawResponse;
            try {
                rawResponse = await this._callLLM(prompt);
            } catch (err) {
                throw new Error(`LLM call failed on iteration ${iteration}: ${err.message}`);
            }

            // Show the LLM's raw thought (what JSON it decided to output)
            onProgress({ type: "llm_thought", iteration, text: rawResponse.trim() });

            // Parse the JSON response
            let parsed;
            try {
                parsed = this._parseResponse(rawResponse);
            } catch (parseErr) {
                // Ask the LLM to retry with valid JSON — mirrors the retry logic in 10_full_agent.py
                onProgress({ type: "status", message: `⚠️ Parse error on iteration ${iteration}. Asking LLM to retry...` });
                messages.push({ role: "assistant", content: rawResponse });
                messages.push({ role: "user",      content: "Please respond with valid JSON only. No markdown, no extra text. Use exactly one of the two JSON formats described." });
                continue;
            }

            // ── Final Answer ─────────────────────────────────────────────────
            if ("answer" in parsed) {
                onProgress({ type: "final", text: parsed.answer });
                return parsed.answer;
            }

            // ── Tool Call ─────────────────────────────────────────────────────
            if ("tool_name" in parsed) {
                const toolName = parsed.tool_name;
                const toolArgs = parsed.tool_arguments || {};

                onProgress({ type: "tool_call", iteration, name: toolName, args: toolArgs });

                // Execute the tool locally
                let toolResult;
                if (this.toolFunctions[toolName]) {
                    try {
                        toolResult = await this.toolFunctions[toolName](toolArgs);
                    } catch (toolErr) {
                        toolResult = { error: `Tool execution failed: ${toolErr.message}` };
                    }
                } else {
                    toolResult = { error: `Unknown tool: "${toolName}". Available tools: ${Object.keys(this.toolFunctions).join(", ")}` };
                }

                onProgress({ type: "tool_result", iteration, name: toolName, result: toolResult });

                // Append to conversation history — the LLM will see all of this next iteration
                messages.push({ role: "assistant", content: rawResponse.trim() });
                messages.push({ role: "tool",      content: JSON.stringify(toolResult) });
                continue;
            }

            // Unexpected JSON shape — treat like a parse error and retry
            onProgress({ type: "status", message: `⚠️ Unexpected response format on iteration ${iteration}. Retrying...` });
            messages.push({ role: "assistant", content: rawResponse });
            messages.push({ role: "user",      content: "Your JSON must have either 'tool_name' or 'answer'. Please try again." });
        }

        const fallback = "The agent reached the maximum number of reasoning steps without reaching a conclusion. Please try a simpler query.";
        onProgress({ type: "final", text: fallback });
        return fallback;
    }
}
