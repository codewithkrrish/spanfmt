/** Thrown by {@link parse} when the input is not a readable duration. */
export class ParseError extends Error {
    constructor(message) {
        super(message);
        this.name = "ParseError";
    }
}
