"use strict";
var udockBootstrapLoader = require.resolve('@udock/vue-plugin-ui/lib/loader');
var udockUiStyleLoader = require.resolve('@udock/vue-plugin-ui/lib/style-loader');
module.exports = function (api, options) {
    var fjs = require.resolve('@udock/vue-plugin-ui');
    var fts = fjs.replace(/\.js$/i, '.ts');
    api.chainWebpack(function (webpackConfig) {
        webpackConfig.module
            .rule('vue-plugin-ui')
            .test(function (module) { return (module == fjs) || (module == fts); })
            .use('babel-loader')
            .loader('babel-loader')
            .end()
            .use('vue-plugin-ui-loaders')
            .loader(udockBootstrapLoader)
            .end();
    });
    api.chainWebpack(function (webpackConfig) {
        webpackConfig.module
            .rule('vue-plugin-ui-style')
            .pre()
            .test(/\/vue-plugin-ui--[\w-]+\/src\/scss\/index\.scss$/i)
            .use('vue-plugin-ui-style-loaders')
            .loader(udockUiStyleLoader)
            .end();
    });
};
