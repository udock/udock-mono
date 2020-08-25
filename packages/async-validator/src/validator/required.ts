import { Validator } from '../'
import rules from '../rule/index.js';

const required: Validator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const type = Array.isArray(value) ? 'array' : typeof value;
  rules.required(rule, value, source, errors, options, type);
  callback(errors);
}

export default required;
