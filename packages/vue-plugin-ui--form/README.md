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
  default: '%s验证失败',
  enum: '%s必须是以下值之一[%s]',
  number: {
    len: '%s的长度必须为%s',
    max: '%s的长度不能超过%s',
    min: '%s的长度不能小于%s',
    range: '请输入有效的%s(%s-%s)！'
  },
  pattern: {
    mismatch: '请输入正确的%s！'
  },
  required: '请输入%s！',
  string: {
    len: '%s的长度必须为%s',
    max: '%s的长度不能超过%s',
    min: '%s的长度不能小于%s',
    range: '请输入有效的%s(%s-%s)！'
  },
  types: {
    array: '%s必须是数组',
    date: '%s必须是日期',
    email: '%s必须是网络邮箱地址',
    float: '%s必须是浮点数',
    integer: '%s必须是整数',
    number: '%s必须是数字',
    string: '%s必须是文本',
    url: '%s必须是url'
  },
  whitespace: '%s不能为空白'
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
    DEFAULT: '%s验证失败',
    ENUM: '%s必须是以下值之一[%s]',
    NUMBER: {
      LEN: '%s的长度必须为%s',
      MAX: '%s的长度不能超过%s',
      MIN: '%s的长度不能小于%s',
      RANGE: '请输入有效的%s(%s-%s)！'
    },
    PATTERN: {
      MISMATCH: '请输入正确的%s！'
    },
    REQUIRED: '请输入%s！',
    STRING: {
      LEN: '%s的长度必须为%s',
      MAX: '%s的长度不能超过%s',
      MIN: '%s的长度不能小于%s',
      RANGE: '请输入有效的%s(%s-%s)！'
    },
    TYPES: {
      ARRAY: '%s必须是数组',
      DATE: '%s必须是日期',
      EMAIL: '%s必须是网络邮箱地址',
      FLOAT: '%s必须是浮点数',
      INTEGER: '%s必须是整数',
      NUMBER: '%s必须是数字',
      STRING: '%s必须是文本',
      URL: '%s必须是URL'
    },
    WHITESPACE: '%s不能为空白'
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
