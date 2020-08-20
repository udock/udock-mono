"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var FRAMEWORK_NAMESPACE = 'udock';
module.exports = function styleLoader(content, map) {
    var uiConfig = {
        debug: false,
        theme: '@/themes/base',
        'pre-styles': [],
        'post-styles': [],
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
    var componentName = 'input';
    // let preStyles = `@import '${uiConfig.theme}';\n`
    var preStyles = "@import '@udock/vue-plugin-ui--theme-default';\n";
    // 全局预加载样式
    uiConfig['pre-styles'].forEach(function (item) {
        preStyles += "@import '" + item + "';\n";
    });
    // 组件预加载样式
    uiConfig.components[componentName]['pre-styles'].forEach(function (item) {
        preStyles += "@import '" + item + "';\n";
    });
    if (uiConfig.components[componentName]['replace-styles']) {
        // 组件替换样式
        content = preStyles;
        uiConfig.components[componentName]['replace-styles'].forEach(function (item) {
            content += "\n@import '" + item + "';";
        });
    }
    else {
        content = preStyles + content;
    }
    // 组件后加载样式
    uiConfig.components[componentName]['post-styles'].forEach(function (item) {
        content += "\n@import '" + item + "';";
    });
    // 全局后加载样式
    uiConfig['post-styles'].forEach(function (item) {
        content += "\n@import '" + item + "';";
    });
    return content;
};
