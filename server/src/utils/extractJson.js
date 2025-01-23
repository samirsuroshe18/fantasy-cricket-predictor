const extractJson = (text) => {
    // Handle null or undefined input
    if (!text) {
        return [];
    }

    const results = [];
    // Match content between triple backticks, including optional language identifier
    const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const language = match[1] || null;  // Language identifier (if any)
        const code = match[2].trim();       // The actual code content
        
        // Add extracted code to results
        results.push({
            language: language,
            code: code
        });
    }
    return results;
}

export default extractJson;

/*  How to use  */

// const blocks = extractJson(jsonString);
// const jsonData = JSON.parse(jsonBlock.code);
// console.log(jsonData);
// console.log(jsonBlock.language)