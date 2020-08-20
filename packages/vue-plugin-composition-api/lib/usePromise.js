"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
function default_1(defaultValue, promise) {
    var val = vue_1.ref(defaultValue);
    promise.then(function (value) {
        val.value = value;
    });
    return val;
}
exports.default = default_1;
