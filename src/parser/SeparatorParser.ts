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
    // Standard whitespace characters
    private whitespaceChars = new Set([" ", "\t", "\r", "\n"]);
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

        // For punctuation characters like period, question mark, exclamation mark
        if (firstChar === "." || firstChar === "?" || firstChar === "!") {
            const nextChar = sourceCode.read(1);
            const charAfterNext = sourceCode.read(2);

            // If next char is a quote, we need to check what follows the quote
            if (nextChar && this.quoteChars.has(nextChar)) {
                // If there's a whitespace after the quote, consider this the end of sentence
                // Example: "This." Next sentence
                if (charAfterNext && this.whitespaceChars.has(charAfterNext)) {
                    // Consume the quote character as part of this sentence
                    sourceCode.peek();
                    return true;
                }
                // If there's nothing after the quote, it's end of text
                if (!charAfterNext) {
                    // Consume the quote character as part of this sentence
                    sourceCode.peek();
                    return true;
                }
                // Otherwise, it's likely something like "This."And
                return false;
            }

            // Standard case: if next char is whitespace, it's end of sentence
            if (nextChar && this.whitespaceChars.has(nextChar)) {
                return true;
            }

            // End of text
            if (!nextChar) {
                return true;
            }

            // Otherwise, it's probably something like "1.23"
            return false;
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
