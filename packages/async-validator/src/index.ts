import {
  format,
  complementError,
  asyncMap,
  warning,
  deepMerge,
  convertFieldsError,
} from './util';
import validators from './validator/index';
import { messages as defaultMessages, newMessages } from './messages';

export type RuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'pattern'
  | 'integer'
  | 'float'
  | 'array'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email'
  | 'any';

export type ValidateRule = (
  rule: RuleItem,
  value: any,
  source: ValidateSource,
  errors: string[],
  options: any,
  type?: string
) => void;

export type Validator = (
  rule: RuleItem,
  value: any,
  callback: (error?: string | string[]) => void,
  source: ValidateSource,
  options: ValidateOption,
) => void | boolean | Array<string> | Error;

export type AsyncValidator = (
  rule: RuleItem,
  value: any,
  callback: (error?: string | string[]) => void,
  source: ValidateSource,
  options: ValidateOption,
) => void | Promise<void>;

export type RuleItem = {
  type?: RuleType; // default type is 'string'
  required?: boolean;
  pattern?: RegExp | string;
  min?: number; // Range of type 'string' and 'array'
  max?: number; // Range of type 'string' and 'array'
  len?: number; // Length of type 'string' and 'array'
  enum?: Array<string | number | boolean | null | undefined>; // possible values of type 'enum'
  whitespace?: boolean;
  fields?: Rules; // ignore when without required
  options?: ValidateOption;
  defaultField?: RuleItem | Rules; // 'object' or 'array' containing validation rules
  transform?: (value: any) => any;
  message?: string;
  asyncValidator?: AsyncValidator;
  validator?: Validator;

  field?: string;
  fullField?: string;
}

export type Rules = {
  [field: string]: RuleItem | RuleItem[];
}

export type ValidateSource = {
  [field: string]: any;
}

export type ValidateOption = {
  // whether to suppress internal warning
  suppressWarning?: boolean;

  // when the first validation rule generates an error stop processed
  first?: boolean;

  // when the first validation rule of the specified field generates an error stop the field processed, 'true' means all fields.
  firstFields?: boolean | string[];

  messages?: Messages
  error?: (rule: RuleItem, message: string) => ValidateError
  keys?: string[]
}

export type ValidateError = {
  message: string;
  field: string;
  rule: RuleItem;
}

export type ErrorList = ValidateError[];
export type FieldErrorList = {
  [field: string]: ValidateError[];
}

export type SeriesItem = {
  rule: RuleItem;
  value: any;
  source: ValidateSource;
  field: string;
}

export type Series = {
  [key: string]: Array<SeriesItem>
}

type Messages = {
  [key: string]: string | number | boolean | Function | Messages
}

/**
 *  Encapsulates a validation schema.
 *
 *  @param descriptor An object declaring validation rules
 *  for this schema.
 */
class Schema {
  rules: Rules | null
  _messages: Messages
  constructor (descriptor: Rules) {
    this.rules = null;
    this._messages = defaultMessages;
    this.define(descriptor);
  }

  messages(messages?: Messages) {
    if (messages) {
      this._messages = deepMerge(newMessages(), messages);
    }
    return this._messages;
  }

  define(rules: Rules) {
    if (!rules) {
      throw new Error('Cannot configure a schema with no rules');
    }
    if (typeof rules !== 'object' || Array.isArray(rules)) {
      throw new Error('Rules must be an object');
    }
    this.rules = {};
    let z;
    let item;
    for (z in rules) {
      if (rules.hasOwnProperty(z)) {
        item = rules[z];
        this.rules[z] = Array.isArray(item) ? item : [item];
      }
    }
  }

  validate(source_: ValidateSource, o: ValidateOption = {}, oc?: (errors: ErrorList | null, fields?: FieldErrorList | null) => void): Promise<void> {
    let source = source_;
    let options = o;
    let callback = oc;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (!this.rules || Object.keys(this.rules).length === 0) {
      if (callback) {
        callback(null);
      }
      return Promise.resolve();
    }

    function complete(results: ErrorList) {
      let i;
      let errors: ErrorList | null = [];
      let fields: FieldErrorList | null = {};

      function add(e: ValidateError) {
        if (Array.isArray(e)) {
          errors = errors!.concat(...e);
        } else {
          errors!.push(e);
        }
      }

      for (i = 0; i < results.length; i++) {
        add(results[i]);
      }
      if (!errors.length) {
        errors = null;
        fields = null;
      } else {
        fields = convertFieldsError(errors);
      }
      callback!(errors, fields);
    }

    if (options.messages) {
      let messages = this.messages();
      if (messages === defaultMessages) {
        messages = newMessages();
      }
      deepMerge(messages, options.messages);
      options.messages = messages;
    } else {
      options.messages = this.messages();
    }
    let arr: RuleItem[];
    let value: any;

    const series: Series = {};
    const keys = options.keys || Object.keys(this.rules);
    keys.forEach((z: string) => {
      arr = this.rules![z] as RuleItem[];
      value = source[z];
      arr.forEach((r) => {
        let rule = r;
        if (typeof rule.transform === 'function') {
          if (source === source_) {
            source = { ...source };
          }
          value = source[z] = rule.transform(value);
        }
        if (typeof rule === 'function') {
          rule = {
            validator: rule,
          };
        } else {
          rule = { ...rule };
        }
        rule.validator = this.getValidationMethod(rule);
        rule.field = z;
        rule.fullField = rule.fullField || z;
        rule.type = this.getType(rule);
        if (!rule.validator) {
          return;
        }
        series[z] = series[z] || [];
        series[z].push({
          rule,
          value,
          source,
          field: z,
        });
      });
    });
    const errorFields: {[ key: string]: number } = {};
    return asyncMap(
      series,
      options,
      (data, doIt) => {
        const rule = data.rule;
        let deep =
          (rule.type === 'object' || rule.type === 'array') &&
          (typeof rule.fields === 'object' ||
            typeof rule.defaultField === 'object');
        deep = deep && (rule.required || (!rule.required && data.value));
        rule.field = data.field;

        function addFullfield(key: string, schema: RuleItem) {
          return {
            ...schema,
            fullField: `${rule.fullField}.${key}`,
          };
        }

        function cb(e?: string | string[]) {
          let errors: string[] = e as string[];
          if (!Array.isArray(errors)) {
            errors = [errors];
          }
          if (!options.suppressWarning && errors.length) {
            Schema.warning('async-validator:', errors);
          }
          if (errors.length && rule.message) {
            errors = ([] as string[]).concat(rule.message);
          }

          let errorList = errors.map(complementError(rule));

          if (options.first && errors.length) {
            errorFields[rule.field!] = 1;
            return doIt(errorList);
          }
          if (!deep) {
            doIt(errorList);
          } else {
            // if rule is required but the target object
            // does not exist fail at the rule level and don't
            // go deeper
            if (rule.required && !data.value) {
              if (rule.message) {
                errorList = ([] as string[]).concat(rule.message).map(complementError(rule));
              } else if (options.error) {
                errorList = [
                  options.error(
                    rule,
                    format(options.messages!.required, rule.field),
                  ),
                ];
              }
              return doIt(errorList);
            }

            let fieldsSchema: Rules = {};
            if (rule.defaultField) {
              for (const k in data.value) {
                if (data.value.hasOwnProperty(k)) {
                  fieldsSchema[k] = rule.defaultField;
                }
              }
            }
            fieldsSchema = {
              ...fieldsSchema,
              ...data.rule.fields,
            };
            for (const f in fieldsSchema) {
              if (fieldsSchema.hasOwnProperty(f)) {
                const fieldSchema = Array.isArray(fieldsSchema[f])
                  ? fieldsSchema[f] as RuleItem[]
                  : [fieldsSchema[f]] as RuleItem[];
                fieldsSchema[f] = fieldSchema.map(addFullfield.bind(null, f));
              }
            }
            const schema = new Schema(fieldsSchema);
            schema.messages(options.messages);
            if (data.rule.options) {
              data.rule.options.messages = options.messages;
              data.rule.options.error = options.error;
            }
            schema.validate(data.value, data.rule.options || options, (errs: ErrorList | null) => {
              const finalErrors = [];
              if (errors && errors.length) {
                finalErrors.push(...errors);
              }
              if (errs && errs.length) {
                finalErrors.push(...errs);
              }
              doIt(finalErrors.length ? finalErrors as ErrorList : null);
            });
          }
        }

        let res;
        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options);
          if (res && res.then) {
            res.then(
              () => cb(),
              (e) => cb(e),
            );
          }
        } else if (rule.validator) {
          res = rule.validator(rule, data.value, cb, data.source, options);
          if (res === true) {
            cb();
          } else if (res === false) {
            cb(rule.message || `${rule.field} fails`);
          } else if (res instanceof Array) {
            cb(res);
          } else if (res instanceof Error) {
            cb(res.message);
          }
        }
      },
      (results) => {
        complete(results);
      },
    );
  }

  getType(rule: RuleItem) {
    if (rule.type === undefined && rule.pattern instanceof RegExp) {
      rule.type = 'pattern';
    }
    if (
      typeof rule.validator !== 'function' &&
      rule.type && !validators.hasOwnProperty(rule.type)
    ) {
      throw new Error(format('Unknown rule type %s', rule.type));
    }
    return rule.type || 'string';
  }

  getValidationMethod(rule: RuleItem) {
    if (typeof rule.validator === 'function') {
      return rule.validator;
    }
    const keys = Object.keys(rule);
    const messageIndex = keys.indexOf('message');
    if (messageIndex !== -1) {
      keys.splice(messageIndex, 1);
    }
    if (keys.length === 1 && keys[0] === 'required') {
      return validators.required;
    }
    return validators[this.getType(rule)] || false;
  }

  static register(type: keyof typeof validators, validator: Validator) {
    if (typeof validator !== 'function') {
      throw new Error(
        'Cannot register a validator by type, validator is not a function',
      );
    }
    validators[type] = validator;
  }

  static warning = warning;
  static messages = defaultMessages;
  static validators = validators;
};

export default Schema;
