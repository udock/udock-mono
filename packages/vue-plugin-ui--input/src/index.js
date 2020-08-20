"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var Input_vue_1 = __importDefault(require("./components/Input.vue"));
function default_1(app, options) {
    app.component(options.name || 'UInput', {
        setup: function (props, context) {
            return function () { return vue_1.h(Input_vue_1.default, __assign({ i18n: options.i18n, i18nMessages: options.i18nMessages }, props), context.slots); };
        }
    });
}
exports.default = default_1;
