# react-app-rewire-auto-router

## 概述

## 使用

安装依赖：

```bash
npm i -D customize-cra react-app-rewired

npm i -D @udock/react-app-rewire-auto-router
```

修改启动脚本：

```json
{
  ...
  "scripts": {
    "start": "react-app-rewired start",
    "build": "react-app-rewired build",
    ...
  }
  ...
}
```

在项目根目录下添加配置脚本 ``config-overrides.js``， 支持一下两种配置方式：

```js
const addAutoRouter = require('@udock/react-app-rewire-auto-router')

module.exports = (config, env) => {
  return addAutoRouter(config, env)
}
```

```js
const { override } = require("customize-cra")
const addAutoRouter = require('@udock/react-app-rewire-auto-router')

module.exports = override(
  addAutoRouter
)
```

创建自动路由配置文件(``src/udock.config.js``)：

```js
module.exports = {
  framework: 'react',
  plugins: {
    'auto-router': {
      debug: true,
      lazyLoad: '@loadable/component',
      ignore: 'ar.ignore', // 在目录中创建一个空文件ar.ignore，此目录内的文件就不会被生成路由扫描，这个配置可以修改这个文件的名称
      path: 'src', // 生成路由扫描的根目录
      'chunk-name': [
        '2'
      ]
    }
  }
}
```

