"use strict";
var udockBootstrapLoader = require.resolve('@udock/vue-plugin-i18n/lib/loader');
var udockI18nLangsLoader = require.resolve('@udock/vue-plugin-i18n/lib/langs-loader');
var REGEX_I18N_LANGS = /(\/modules\/[\w-]+)*\/i18n\/langs\/index\.(t|j)s$/i;
module.exports = function (api, options) {
    var fjs = require.resolve('@udock/vue-plugin-i18n');
    var fts = fjs.replace(/\.js$/i, '.ts');
    api.chainWebpack(function (webpackConfig) {
        webpackConfig.module
            .rule('vue-plugin-i18n')
            .test(function (module) { return (module == fjs) || (module == fts); })
            .use('babel-loader')
            .loader('babel-loader')
            .end()
            .use('vue-plugin-i18n-loaders')
            .loader(udockBootstrapLoader)
            .end();
        webpackConfig.module
            .rule('vue-plugin-i18n-langs')
            .test(REGEX_I18N_LANGS)
            .use('babel-loader')
            .loader('babel-loader')
            .end()
            .use('vue-plugin-i18n-langs-loaders')
            .loader(udockI18nLangsLoader)
            .end();
    });
};
