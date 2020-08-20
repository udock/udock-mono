"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var lodash_1 = __importDefault(require("lodash"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
module.exports = function (loader, options) {
    var dir = options.path;
    var langs = fs_1.default.readdirSync(dir).filter(function (file) { return fs_1.default.statSync(path_1.default.join(dir, file)).isDirectory(); });
    var data = {
        langs: langs,
        defaultLang: 'zh-CN',
        fallbackLang: 'zh-CN',
        langsDir: './' + path_1.default.relative(path_1.default.dirname(loader.resourcePath), dir)
    };
    var imports = {};
    var templateFilePath = path_1.default.resolve(__dirname, '..', 'template', 'index.js');
    var fileContent = fs_1.default.readFileSync(templateFilePath, 'utf8');
    var template = lodash_1.default.template(fileContent, { imports: imports });
    return {
        code: template(Object.assign({}, data))
    };
};
