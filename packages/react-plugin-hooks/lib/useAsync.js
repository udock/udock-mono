"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function default_1(defaultValue, func) {
    var _a = react_1.useState(defaultValue), val = _a[0], setVal = _a[1];
    var isUnmounted = false;
    react_1.useEffect(function () {
        func().then(function (value) {
            if (isUnmounted)
                return;
            setVal(value);
        });
        return function () {
            isUnmounted = true;
        };
    });
    return val;
}
exports.default = default_1;
