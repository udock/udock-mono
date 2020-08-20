# vue-cli-plugin-auto-router

## 概述

vue-cli 3 插件，用于为项目添加自动路由生成功能

## 安装

首先安装并使用 vue-cli 3 创建工程

```bash
# 全局安装 vue-cli v3 版本
npm i -g @vue/cli

# 使用 vue-cli v3 创建工程
vue create vue-project
```

安装插件并进行配置

```bash
# 进入项目目录
cd vue-project

# 安装本插件 适用 vue 2.x
vue add @udock/auto-router@^2.0.0

# 安装本插件 适用 vue 3.x
vue add @udock/auto-router@^3.0.0
```

## 配置

在工程目录的 ``src`` 目录下创建名为 ``udock.config.js`` 的文件，并添加如下内容

```js
module.exports = {
  framework: 'vue',
  plugins: {
    'auto-router': {
      debug: true,
      ignore: 'ar.ignore', // 在目录中创建一个空文件ar.ignore，此目录内的文件就不会被生成路由扫描，这个配置可以修改这个文件的名称
      path: 'src', // 生成路由扫描的根目录
      'chunk-name': [
        '2'
      ]
    }
  }
}
```

## 使用

对于 vue 3.x ，路由可进行如下配置

```js
import { createRouter, createWebHashHistory } from 'vue-router'

import routes from '@udock/vue-plugin-auto-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
```

对于 vue 2.x ，路由可进行如下配置

```js
import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from '@udock/vue-plugin-auto-router'

Vue.use(VueRouter)

const router = new VueRouter({
  routes
})

export default router
```
