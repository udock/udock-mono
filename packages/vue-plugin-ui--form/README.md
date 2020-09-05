# 表单组件

## 配置

### 默认规则配置

创建 ``@/config/async-validator-default-rules.ts`` 文件，示例如下：

```ts
/* eslint-disable no-template-curly-in-string */
export default {
  required: [
    { required: true, message: '请输入${label}', trigger: 'blur' }
  ],
  url: [
    { type: 'url', message: '${label}必须为URL', trigger: 'blur' }
  ],
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在${min}到${max}个字符', trigger: 'blur' }
  ],
  userPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在6到20个字符', trigger: 'blur' }
  ],
  userPasswordRepeat: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在6到20个字符', trigger: 'blur' }
  ],
  userEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' }
  ]
}
```

如需要多语言支持，可进行如下配置：

```ts
/* eslint-disable no-template-curly-in-string */
export default {
  required: [
    { required: true, message: '${t("CST_RULE.REQUIRED")}', trigger: 'blur' }
  ],
  url: [
    { type: 'url', message: '${t("CST_RULE.URL")}', trigger: 'blur' }
  ],
  userName: [
    { required: true, message: '${t("CST_RULE.REQUIRED")}', trigger: 'blur' },
    { min: 4, max: 20, message: '${t("CST_RULE.RANGE")}', trigger: 'blur' }
  ],
  userPassword: [
    { required: true, message: '${t("CST_RULE.REQUIRED")}', trigger: 'blur' },
    { min: 6, max: 20, message: '${t("CST_RULE.RANGE")}', trigger: 'blur' }
  ],
  userPasswordRepeat: [
    { required: true, message: '${t("CST_RULE.REQUIRED")}', trigger: 'blur' },
    { min: 6, max: 20, message: '${t("CST_RULE.RANGE")}', trigger: 'blur' }
  ],
  userEmail: [
    { required: true, message: '${t("CST_RULE.EMAIL")}', trigger: 'blur' }
  ]
}
```

并配置多语言文件：
```ts
export default {
  ...
  CST_RULE: {
    REQUIRED: '请输入${label}！',
    RANGE: '请输入有效的${label}(${min}-${max})！',
    EMAIL: '${label}必须是网络邮箱地址',
    URL: '${label}必须是URL'
  }
  ...
}
```

udock.config.js 中添加: ``plugins.ui.components.form.validator['rules|require'] = '@/config/async-validator-default-rules'``

```js
module.exports = {
  framework: 'vue',
  plugins: {
    ...
    ui: {
      components: {
        form: {
          validator: {
            'rules|require': '@/config/async-validator-default-rules',
            ...
          }
        }
      }
    }
    ...
  }
}
```

### 默认话束配置

创建 ``@/config/async-validator-default-messages.ts`` 文件，示例如下：

```ts
export default {
  date: {
    format: '请输入有效的日期格式',
    invalid: '请输入有效的日期',
    parse: '请输入有效的日期'
  },
  default: '${label}验证失败',
  enum: '${label}必须是以下值之一[${$ctx["enum"]}]',
  number: {
    len: '${label}的长度必须为${len}',
    max: '${label}的值不能超过${max}',
    min: '${label}的值不能小于${lmin}',
    range: '请输入有效的${label}(${min}-${max})！'
  },
  pattern: {
    mismatch: '请输入正确的${label}！'
  },
  required: '请输入${label}！',
  string: {
    len: '${label}的长度必须为${len}',
    max: '${label}的长度不能超过${max}',
    min: '${label}的长度不能小于${min}',
    range: '请输入有效的${label}(${min}-${max})！'
  },
  types: {
    array: '${label}必须是数组',
    date: '${label}必须是日期',
    email: '${label}必须是网络邮箱地址',
    float: '${label}必须是浮点数',
    integer: '${label}必须是整数',
    number: '${label}必须是数字',
    string: '${label}必须是文本',
    url: '${label}必须是url'
  },
  whitespace: '${label}不能为空白'
}
```

如需要多语言支持，可进行如下配置：

```ts
import i18n from '@udock/vue-plugin-i18n'
import { defaultMessagesI18nWrapper } from '@udock/vue-plugin-ui--form'

const $t = defaultMessagesI18nWrapper(i18n)

export default {
  date: {
    format: $t('RULE.DATE.FORMAT'),
    invalid: $t('RULE.DATE.INVALID'),
    parse: $t('RULE.DATE.PARSE')
  },
  default: $t('RULE.DEFAULT'),
  enum: $t('RULE.ENUM'),
  number: {
    len: $t('RULE.NUMBER.LEN'),
    max: $t('RULE.NUMBER.MAX'),
    min: $t('RULE.NUMBER.MIN'),
    range: $t('RULE.NUMBER.RANGE')
  },
  pattern: {
    mismatch: $t('RULE.PATTERN.MISMATCH')
  },
  required: $t('RULE.REQUIRED'),
  string: {
    len: $t('RULE.STRING.LEN'),
    max: $t('RULE.STRING.MAX'),
    min: $t('RULE.STRING.MIN'),
    range: $t('RULE.STRING.RANGE')
  },
  types: {
    array: $t('RULE.TYPES.ARRAY'),
    date: $t('RULE.TYPES.DATE'),
    email: $t('RULE.TYPES.EMAIL'),
    float: $t('RULE.TYPES.FLOAT'),
    integer: $t('RULE.TYPES.INTEGER'),
    number: $t('RULE.TYPES.NUMBER'),
    string: $t('RULE.TYPES.STRING'),
    url: $t('RULE.TYPES.URL')
  },
  whitespace: $t('RULE.WHITESPACE')
}
```

并配置多语言文件：
```ts
export default {
  ...
  RULE: {
    DATE: {
      FORMAT: '请输入有效的日期格式',
      INVALID: '请输入有效的日期',
      PARSE: '请输入有效的日期'
    },
    DEFAULT: '${label}验证失败',
    ENUM: '${label}必须是以下值之一[${$ctx["enum"]}]',
    NUMBER: {
      LEN: '${label}的长度必须为${len}',
      MAX: '${label}的值不能超过${max}',
      MIN: '${label}的值不能小于${min}',
      RANGE: '请输入有效的${label}(${min}-${max})！'
    },
    PATTERN: {
      MISMATCH: '请输入正确的${label}！'
    },
    REQUIRED: '请输入${label}！',
    STRING: {
      LEN: '${label}的长度必须为${len}',
      MAX: '${label}的长度不能超过${max}',
      MIN: '${label}的长度不能小于${min}',
      RANGE: '请输入有效的${label}(${min}-${max})！'
    },
    TYPES: {
      ARRAY: '${label}必须是数组',
      DATE: '${label}必须是日期',
      EMAIL: '${label}必须是网络邮箱地址',
      FLOAT: '${label}必须是浮点数',
      INTEGER: '${label}必须是整数',
      NUMBER: '${label}必须是数字',
      STRING: '${label}必须是文本',
      URL: '${label}必须是URL'
    },
    WHITESPACE: '${label}不能为空白'
  }
  ...
}
```

udock.config.js 中添加: ``plugins.ui.components.form.validator['messages|require'] = '@/config/async-validator-default-messages'``

```js
module.exports = {
  framework: 'vue',
  plugins: {
    ...
    ui: {
      components: {
        form: {
          validator: {
            'messages|require': '@/config/async-validator-default-messages',
            ...
          }
        }
      }
    }
    ...
  }
}
```
