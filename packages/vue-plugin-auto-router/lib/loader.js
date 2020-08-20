"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var path = require("path");
var generator_1 = __importDefault(require("./generator"));
var FRAMEWORK_NAMESPACE = 'udock';
var PICK_REGEX = /<route-config[^>]*>([\s\S]*)<\/route-config>/;
module.exports = function udockBootstrapLoader(content, map) {
    if (PICK_REGEX.test(content)) {
        return PICK_REGEX.exec(content)[1];
    }
    else {
        var configPath = path.resolve("./src/" + FRAMEWORK_NAMESPACE + ".config.js");
        delete require.cache[configPath];
        this.addDependency(configPath);
        var autoRouterConfig_1 = {
            debug: false,
            ignore: 'ar.ignore',
            path: 'src',
            'chunk-name': [
                '2'
            ]
        };
        try {
            var config = require(configPath);
            autoRouterConfig_1 = config.plugins['auto-router'];
        }
        catch (e) {
            console.log('\nframework config error:');
            this.callback(e);
            return;
        }
        return generator_1.default(this, autoRouterConfig_1).then(function (result) {
            if (autoRouterConfig_1.debug) {
                console.log('======== auto-router =========');
                console.log(result.code);
                console.log('======== =========== =========');
            }
            return result.code;
        });
    }
};
