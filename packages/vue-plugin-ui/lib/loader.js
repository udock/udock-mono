"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var generator_1 = __importDefault(require("./generator"));
var FRAMEWORK_NAMESPACE = 'udock';
module.exports = function uiLoader(content, map) {
    var uiConfig = {
        debug: true,
        components: {}
    };
    var configPath = path_1.default.resolve("./src/" + FRAMEWORK_NAMESPACE + ".config.js");
    this.addDependency(configPath);
    delete require.cache[configPath];
    if (fs_1.default.existsSync(configPath)) {
        try {
            var config = require(configPath);
            Object.assign(uiConfig, config.plugins.ui);
        }
        catch (e) {
            console.log('\nframework config error:');
            this.callback(e);
            return;
        }
    }
    var result = generator_1.default(this, uiConfig);
    if (uiConfig.debug) {
        console.log('======== ui =========');
        console.log(result.code);
        console.log('======== =========== =========');
    }
    return result.code;
};
