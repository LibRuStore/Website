export class RequestMaker {
    /**
     * Constructs a new RequestMaker.
     * 
     * @param {string} base The API address
     */
    constructor(base) {
        this.base = base;
    }

    /**
     * GETs data.
     * 
     * @param {string} path The path
     * @returns {object} The response
     */
    async get(path) {
        const res = await fetch(new URL(path, this.base).href);
        const json = await res.json();
        if(json.status === "error") throw new Error("Unknown error: " + json.error);
        return json.data;
    }
}