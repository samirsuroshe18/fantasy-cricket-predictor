const extractTextAndJson = (text) => {
    // Handle null or undefined input
    if (!text) {
        return {
            codeBlocks: [],
            textBlocks: []
        };
    }

    const result = {
        codeBlocks: [],
        textBlocks: []
    };

    // Match content between triple backticks, including optional language identifier
    const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;

    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        // Add text before this code block (if any)
        const textBeforeCode = text.slice(lastIndex, match.index).trim();
        if (textBeforeCode) {
            result.textBlocks.push(textBeforeCode);
        }

        // Add the code block
        result.codeBlocks.push({
            language: match[1] || null,  // Language identifier (if any)
            code: match[2].trim()        // The actual code content
        });

        lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last code block
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
        result.textBlocks.push(remainingText);
    }

    return result;
}

export default extractTextAndJson;


/* How to use */

// const content = extractTextAndJson(jsonString);
// console.log('Regular text:', content.textBlocks);
// console.log('Data blocks:', JSON.parse(content.codeBlocks[0].code));
// console.log('Data format:', JSON.parse(content.codeBlocks[0].language));