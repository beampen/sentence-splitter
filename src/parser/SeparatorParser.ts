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
    // Pre-define a set of valid next characters for better performance
    private validNextChars = new Set([" ", "\t", "\r", "\n", '"', "'", "”", "’"]);

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
        const nextChar = sourceCode.read(1);
        if (!firstChar) {
            return false;
        }
        if (!this.separatorCharacters.includes(firstChar)) {
            return false;
        }
        // Need space after period
        // Example: "This is a pen. This is not a pen."
        // It will avoid false-position like `1.23`
        if (firstChar === ".") {
            if (nextChar) {
                // Use a Set lookup instead of regex for better performance
                return this.validNextChars.has(nextChar);
            } else {
                return true;
            }
        }
        return true;
    }

    seek(sourceCode: SourceCode): void {
        while (this.test(sourceCode)) {
            sourceCode.peek();
        }
    }
}
