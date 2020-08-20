"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function default_1(name) {
    react_1.useEffect(function () {
        console.log("[" + name + "]: componentDidMount/Update(useEffect)");
        return function () {
            console.log("[" + name + "]: componentWillUnmount(useEffect)");
        };
    });
    react_1.useLayoutEffect(function () {
        console.log("[" + name + "]: componentDidMount/Update(useLayoutEffect)");
        return function () {
            console.log("[" + name + "]: componentWillUnmount(useLayoutEffect)");
        };
    });
}
exports.default = default_1;
