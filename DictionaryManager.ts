export class DictionaryManager {
    private words: Set<string> = new Set();
    private isLoaded: boolean = false;

    constructor() {
        this.loadDictionary();
    }

    private async loadDictionary() {
        try {
            // Using a list of ~20k common English words for better game balance than a full dictionary
            const response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt');
            if (!response.ok) throw new Error('Failed to load dictionary');
            const text = await response.text();
            // Split by new line and add to Set (uppercase for consistency)
            text.split('\n').forEach(word => {
                const trimmed = word.trim().toUpperCase();
                if (trimmed.length >= 2) { // Minimum 2 letters
                    this.words.add(trimmed);
                }
            });
            this.isLoaded = true;
            console.log(`Dictionary loaded with ${this.words.size} words.`);
        } catch (error) {
            console.error("Error loading dictionary:", error);
            // Fallback to a small internal list if fetch fails, to prevent game breaking
            this.addFallbackWords();
            this.isLoaded = true;
        }
    }

    private addFallbackWords() {
        // A small fallback list just in case
        const fallback = ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "ANY", "CAN", "HAD", "HAS", "HIM", "HIS", "HOW", "INK", "MAN", "NEW", "NOW", "OLD", "ONE", "OUT", "PUT", "RUN", "SAY", "SHE", "SIT", "SON", "TOO", "USE", "WAS", "WAY", "WHO", "WHY", "WIN", "YES", "YET", "ZOO"];
        fallback.forEach(w => this.words.add(w));
    }

    public isValid(word: string): boolean {
        if (!this.isLoaded) return true; // Fail open if not loaded yet to avoid blocking
        return this.words.has(word.toUpperCase());
    }

    public get isReady(): boolean {
        return this.isLoaded;
    }

    public getAllWords(): string[] {
        return Array.from(this.words);
    }
}
