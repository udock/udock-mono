"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var generator_1 = __importDefault(require("./generator"));
var FRAMEWORK_NAMESPACE = 'udock';
module.exports = function i18nLoader(content, map) {
    var i18nConfig = {
        debug: true,
        path: 'src/i18n/langs',
        fallback: 'en-US',
        default: 'zh-CN'
    };
    var configPath = path_1.default.resolve("./src/" + FRAMEWORK_NAMESPACE + ".config.js");
    this.addDependency(configPath);
    delete require.cache[configPath];
    if (fs_1.default.existsSync(configPath)) {
        try {
            var config = require(configPath);
            Object.assign(i18nConfig, config.plugins.i18n);
        }
        catch (e) {
            console.log('\nframework config error:');
            this.callback(e);
            return;
        }
    }
    var result = generator_1.default(this, i18nConfig);
    if (i18nConfig.debug) {
        console.log('======== i18n =========');
        console.log(result.code);
        console.log('======== =========== =========');
    }
    return result.code;
};
