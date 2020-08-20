"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var safeParseJSON_1 = __importDefault(require("./utils/safeParseJSON"));
function default_1(key, options) {
    var val = vue_1.ref(safeParseJSON_1.default(sessionStorage.getItem(key), options.defaultValue));
    return vue_1.computed({
        get: function () {
            return val.value;
        },
        set: function (value) {
            if (!options.readonly) {
                sessionStorage.setItem(key, JSON.stringify(value));
                val.value = value;
            }
            else {
                val.value = undefined;
                vue_1.nextTick(function () {
                    val.value = safeParseJSON_1.default(sessionStorage.getItem(key), options.defaultValue);
                });
                console.warn('try change readonly sessionStorage: ', key);
            }
        }
    });
}
exports.default = default_1;
