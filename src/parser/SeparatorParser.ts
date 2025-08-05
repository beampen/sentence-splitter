import { SourceCode } from "./SourceCode.js";
import { AbstractParser } from "./AbstractParser.js";

export const DefaultOptions = {
    separatorCharacters: [
        ".", // period
        "．", // (ja) zenkaku-period
        "。", // (ja) 句点
        "?", // question mark
        "!", //  exclamation mark
        "？", // (ja) zenkaku question mark
        "！", // (ja) zenkaku exclamation mark
        "\n"
    ]
};

export interface SeparatorParserOptions {
    /**
     * Recognize each characters as separator
     * Example [".", "!", "?"]
     */
    separatorCharacters?: string[];
}

/**
 * Separator parser
 */
export class SeparatorParser implements AbstractParser {
    private separatorCharacters: string[];
    // Quote characters that should be kept with the preceding sentence
    private quoteChars = new Set(['"', "'", "”", "’"]);

    constructor(readonly options?: SeparatorParserOptions) {
        this.separatorCharacters =
            options && options.separatorCharacters ? options.separatorCharacters : DefaultOptions.separatorCharacters;
    }

    test(sourceCode: SourceCode) {
        if (sourceCode.isInContext()) {
            return false;
        }
        if (sourceCode.isInContextRange()) {
            return false;
        }

        const firstChar = sourceCode.read();
        if (!firstChar) {
            return false;
        }

        if (!this.separatorCharacters.includes(firstChar)) {
            return false;
        }

        // For punctuation characters that might be followed by quotes
        if (firstChar === "." || firstChar === "?" || firstChar === "!") {
            const nextChar = sourceCode.read(1);

            // If there's no next character, it's end of text
            if (!nextChar) {
                return true;
            }

            // If next char is a quote, include it with the current sentence
            if (this.quoteChars.has(nextChar)) {
                sourceCode.peek(); // Consume the quote
                return true;
            }

            // For period, we need to check if it's followed by whitespace
            // to avoid breaking numbers like "1.23"
            if (firstChar === ".") {
                return /[\s\t\r\n]/.test(nextChar);
            }

            // For other punctuation, no special check needed
            return true;
        }

        // For other separators like newline
        return true;
    }

    seek(sourceCode: SourceCode): void {
        let count = 0;
        const maxIterations = 1000; // Safety measure

        while (count < maxIterations && this.test(sourceCode)) {
            sourceCode.peek();
            count++;
        }

        if (count >= maxIterations) {
            console.warn("SeparatorParser reached maximum iterations - possible infinite loop detected");
        }
    }
}
