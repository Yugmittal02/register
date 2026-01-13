import { synonymMap } from '../data/dictionaries';

// ---------------------------------------------------------
// ?? INTELLIGENT SEARCH ALGORITHM (Fuzzy Brain)
// ---------------------------------------------------------
export const performSmartSearch = (rawTranscript: string, inventory: any[], pages: any[], options: { useFuzzy?: boolean } = {}) => {
    const useFuzzy = options.useFuzzy !== false;
    // Step A: Normalize & Translate (Tel -> Oil)
    let processedText = rawTranscript.toLowerCase().trim();

    // Replace mapped words (whole word match)
    Object.keys(synonymMap).forEach(desiWord => {
        const regex = new RegExp(`\\b${desiWord}\\b`, 'gi');
        if (regex.test(processedText)) {
            processedText = processedText.replace(regex, synonymMap[desiWord]);
        }
    });

    console.log(`Original: "${rawTranscript}" -> Processed: "${processedText}"`);

    // Step B: Keyword Extraction (Remove filler words)
    const fillerWords = /\b(check|search|find|dhundo|dekho|batao|kya|hai|available|stock|mein|ka|ki|ke|se|aur|or|the|is|a|an|for|in|of)\b/gi;
    const keywords = processedText
        .replace(fillerWords, "")
        .trim()
        .split(/\s+/)
        .filter(k => k.length > 1); // Remove single letter remnants

    if (keywords.length === 0) return { match: false, items: [], interpretedAs: processedText };

    // Step C: Scoring System (Advanced Fuzzy Logic)
    const scoredItems = inventory.map(item => {
        let score = 0;
        const itemCar = (item.car || '').toLowerCase();
        const page = pages.find(p => p.id === item.pageId);
        const itemName = (page?.itemName || '').toLowerCase();
        const combinedText = `${itemCar} ${itemName}`;

        keywords.forEach(word => {
            // Exact match = 10 points
            if (combinedText.includes(word)) {
                score += 10;
                return;
            }

            if (!useFuzzy) return;

            // Partial match (for typos) = 5 points
            if (word.length > 3) {
                const partialWord = word.slice(0, -1); // Remove last char for typo tolerance
                if (combinedText.includes(partialWord)) score += 5;
            }

            // First letter match (very loose) = 2 points
            else if (combinedText.split(' ').some(w => w.startsWith(word[0]))) score += 2;
        });

        return { ...item, score, pageName: itemName };
    });

    // Filter items with score > 0 and Sort by highest score
    const matches = scoredItems
        .filter((i: any) => i.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10); // Limit to top 10 results

    return { match: matches.length > 0, items: matches, interpretedAs: processedText };
};
