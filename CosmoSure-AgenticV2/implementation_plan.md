# CosmoSure Agent — Full Agentic Loop Chrome Extension

## Overview

The existing plugin already has the right structure (sidebar, reasoning chain UI, Gemini API integration, 3 custom tools). However, it uses Gemini's **native function-calling** format, which is different from the `10_full_agent.py` pattern.

The `10_full_agent.py` pattern works like this:
1. **Custom JSON protocol** — the LLM is instructed via a system prompt to respond ONLY as JSON: either `{"tool_name": "...", "tool_arguments": {...}}` or `{"answer": "..."}`.
2. **Manual conversation history accumulation** — every prompt includes ALL past interactions (system + user + assistant + tool results).
3. **The extension must display** each iteration: the LLM's raw decision, the tool call, and the tool result, before showing the final answer.

The current extension uses Gemini's native `functionDeclarations` + `functionCall` response type. We will replace this with the **manual JSON protocol agentic loop** matching `10_full_agent.py` exactly, while keeping the 3 existing skincare-specific tools.

---

## Proposed Changes

### Core Architecture Change: Manual Agentic Loop

Instead of Gemini's native function calling, we instruct the model via a **system prompt** to reply ONLY as one of two JSON shapes:
```
{"tool_name": "<name>", "tool_arguments": {"<arg>": "<value>"}}
{"answer": "<final answer in Markdown>"}
```

Each iteration we build a full text prompt from the message history array:
```
[System Prompt]
User: <original query>
Assistant: <json tool call>
Tool Result: <json result>
Assistant: <json tool call>
Tool Result: <json result>
...
```

This mirrors the `run_agent()` function in `10_full_agent.py` exactly.

---

### Files to Modify

#### [MODIFY] [gemini_api.js](file:///c:/Users/jahna/OneDrive/Documents/GitHub/Extensive-AI-Agents-V3/CosmoSure-AgenticV2/gemini_api.js)

Complete rewrite of `runAgentLoop()`:
- Remove native `functionDeclarations` / `functionCall` API usage
- Use `generateContent` with a plain text prompt (no tools array)
- Build a `messages[]` array exactly like the Python version
- Parse LLM response as JSON (`tool_name` | `answer`)
- Handle markdown code fences in response (same `parseResponse()` as Python)
- Call tool functions locally, append result to history
- Emit progress events for each iteration: `llm_thinking`, `tool_call`, `tool_result`, `final`
- Add `llm_thought` step display (show what JSON the LLM returned before executing)

#### [MODIFY] [agent_tools.js](file:///c:/Users/jahna/OneDrive/Documents/GitHub/Extensive-AI-Agents-V3/CosmoSure-AgenticV2/agent_tools.js)

- Remove `toolsDefinition` (no longer needed for native function calling)
- Keep `toolFunctions` as-is (the 3 tools remain)
- Expand mock data slightly for richer results
- Add tool descriptions to a `TOOL_DESCRIPTIONS` export (used in system prompt)

#### [MODIFY] [index.js](file:///c:/Users/jahna/OneDrive/Documents/GitHub/Extensive-AI-Agents-V3/CosmoSure-AgenticV2/index.js)

- Add handler for new `llm_thought` progress event (shows the raw JSON the model returned)
- Add iteration counter display
- Improve the reasoning chain rendering (numbered steps)

#### [MODIFY] [index.html](file:///c:/Users/jahna/OneDrive/Documents/GitHub/Extensive-AI-Agents-V3/CosmoSure-AgenticV2/index.html)

- Add iteration counter element
- Add `llm-thinking` step type in the reasoning chain labels

#### [MODIFY] [index.css](file:///c:/Users/jahna/OneDrive/Documents/GitHub/Extensive-AI-Agents-V3/CosmoSure-AgenticV2/index.css)

- Add `.reasoning-step.llm-thought` styling (distinct color for LLM's raw reasoning)
- Add `.iteration-header` for numbered step separators
- Enhance the reasoning chain visual design

---

## Key Requirements from Assignment

| Requirement | Implementation |
|---|---|
| Call LLM multiple times | `while (!isDone && loopCount < MAX_LOOPS)` loop |
| All past interactions in each query | `messages[]` array built into full text prompt each iteration |
| Display agent's reasoning chain | Each `onProgress` event appends a visible step to UI |
| Show each tool call AND result | `tool_call` + `tool_result` progress events |
| Show LLM's JSON decision | NEW `llm_thought` event shows raw model output |
| At least 3 custom tool functions | `searchProductDatabase`, `getIngredientAnalysis`, `checkRetailPricing` |

---

## Verification Plan

- Load extension in Chrome (`chrome://extensions` → Load unpacked)
- Enter API key, ask: *"Find me a serum for dullness and tell me what vitamin C does and how much it costs"*
- Should trigger: `searchProductDatabase` → `getIngredientAnalysis` → `checkRetailPricing` → final answer
- Each step should appear in the reasoning chain with LLM thought, tool call, and result visible
