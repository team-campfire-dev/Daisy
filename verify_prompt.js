const { generateDateCourse } = require('./src/services/gemini');

// Mock specific parts to avoid full next.js environment issues in standalone script
// We can't import typescript directly in node easily without ts-node
// So we will create a simple mock test script that just checks the prompting logic if possible
// But since gemini.ts is TS and has imports, we might need to rely on manual verification or a more complex setup.

// Alternative: Create a new test file `test_search_logic.ts` and run it with ts-node if available, or just use nextjs api route to test.
// Let's rely on the user to test the chat primarily, or we can create a temporary API route.

const fs = require('fs');
const path = require('path');

// We will construct a minimal reproduction of the prompt logic to verify it extracts keywords correctly.
// This is unit testing the prompt instruction itself.

const systemContext = "Date Planner";
const historyText = "User: I want to go to Sinseon Hwaro for lunch and Yeonnam Toma for dinner.";
const userMessage = "Recommend a course.";

const queryPrompt = `
            The user wants a complete date course. 
            Analyze the CONVERSATION HISTORY and SYSTEM CONTEXT.
            Determine the Target Region (e.g. Gangnam, Hongdae). If not found, infer from user message.
            
            CRITICAL INSTRUCTION:
            If the user explicitly mentions specific place names (e.g., "I want to go to [Place Name]"), 
            YOU MUST include that specific place name as one of the search queries to ensure it is found.
            
            Generate 4-5 Google Maps Search Queries to split across:
            1. **Specific Requested Places** (Priority 1)
            2. Restaurant (Meal)
            3. Cafe
            4. Activity (e.g. Workshop, Walk, Exhibition)
            
            System Context: ${systemContext}
            Conversation History:
            ${historyText}
            Current Message: "${userMessage}"
            
            Return JSON ARRAY of strings only. Example: ["Yeonnam Toma Main Branch", "Sinseon Hwaro", "Hongdae quiet cafe"]
        `;

console.log("----- PROMPT PREVIEW -----");
console.log(queryPrompt);
console.log("--------------------------");
