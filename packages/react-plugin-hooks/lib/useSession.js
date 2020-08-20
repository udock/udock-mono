"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var safeParseJSON_1 = __importDefault(require("./utils/safeParseJSON"));
function default_1(key, options) {
    var value = sessionStorage.getItem(key);
    var defaultValue = safeParseJSON_1.default(value, options.defaultValue);
    var _a = react_1.useReducer(function (oldValue, newValue) {
        if (!options.readonly) {
            sessionStorage.setItem(key, JSON.stringify(newValue));
            return newValue;
        }
        else {
            console.warn('try change readonly sessionStorage: ', key);
            return oldValue;
        }
    }, defaultValue), val = _a[0], setVal = _a[1];
    return [val, setVal];
}
exports.default = default_1;
