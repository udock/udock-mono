"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function safeParseJSON(jsonString, defaultValue) {
    if (jsonString != null) {
        try {
            return JSON.parse(jsonString);
        }
        catch (_a) { }
    }
    return defaultValue;
}
exports.default = safeParseJSON;
