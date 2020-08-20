"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
function default_1(name) {
    vue_1.onActivated(function () {
        console.log("[" + name + "] onActivated");
    });
    vue_1.onBeforeMount(function () {
        console.log("[" + name + "] onBeforeMount");
    });
    vue_1.onBeforeUpdate(function () {
        console.log("[" + name + "] onBeforeUpdate");
    });
    vue_1.onBeforeUnmount(function () {
        console.log("[" + name + "] onBeforeUnmount");
    });
    vue_1.onDeactivated(function () {
        console.log("[" + name + "] onDeactivated");
    });
    vue_1.onErrorCaptured(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        console.log("[" + name + "] onErrorCaptured", args);
    });
    vue_1.onMounted(function () {
        console.log("[" + name + "] onMounted");
    });
    vue_1.onRenderTracked(function () {
        console.log("[" + name + "] onRenderTracked");
    });
    vue_1.onRenderTriggered(function () {
        console.log("[" + name + "] onRenderTriggered");
    });
    vue_1.onUnmounted(function () {
        console.log("[" + name + "] onUnmounted");
    });
    vue_1.onUpdated(function () {
        console.log("[" + name + "] onUpdated");
    });
}
exports.default = default_1;
