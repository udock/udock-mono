"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var lodash_1 = __importDefault(require("lodash"));
var FRAMEWORK_NAMESPACE = 'udock';
function generate(loader, options) {
    var dir = path_1.default.join(loader.resourcePath, '..');
    var chunkNameBase = path_1.default.relative(path_1.default.resolve('.'), dir)
        .toLowerCase()
        .replace(/^src\//, '')
        .replace(/\/i18n\/langs$/, '')
        .split(/\/|\\/)
        .filter(function (item) { return item !== 'modules'; })
        .join('/');
    var langs = fs_1.default.readdirSync(dir)
        .filter(function (file) {
        var tsPath = path_1.default.join(dir, file, 'index.ts');
        var jsPath = path_1.default.join(dir, file, 'index.js');
        return fs_1.default.existsSync(tsPath) || fs_1.default.existsSync(jsPath);
    })
        .map(function (item) {
        var filePath = path_1.default.join(dir, item, 'index.ts');
        filePath = fs_1.default.existsSync(filePath) ? filePath : filePath.replace(/\.ts$/, '.js');
        loader.addDependency(filePath);
        var fileContent = fs_1.default.readFileSync(filePath, 'utf8') + '';
        return {
            name: item,
            lazy: !/\/\/\s*lazy\s*=\s*false\b/.test(fileContent)
        };
    });
    var data = {
        langs: langs,
        defaultLang: 'zh-CN',
        fallbackLang: 'zh-CN',
        chunkNameBase: chunkNameBase
    };
    var imports = {};
    var templateFilePath = path_1.default.resolve(__dirname, '..', 'template', 'langs.js');
    var fileContent = fs_1.default.readFileSync(templateFilePath, 'utf8');
    var template = lodash_1.default.template(fileContent, { imports: imports });
    return {
        code: template(Object.assign({}, data))
    };
}
module.exports = function i18nLangsLoader(content, map) {
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
    if (content.length < 30) {
        var result = generate(this, i18nConfig);
        if (i18nConfig.debug) {
            console.log('======== i18n langs =========');
            console.log(result.code);
            console.log('======== =========== =========');
        }
        return result.code;
    }
    else {
        return content;
    }
};
