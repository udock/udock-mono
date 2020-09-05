/* eslint no-console:0 */

import { ErrorList, SeriesItem, RuleItem, ValidateError, FieldErrorList, ValidateOption, Series } from ".";

type HandleFunc = (item: SeriesItem, next: (errors: ErrorList | null) => void) => void

const formatRegExp = /%[sdj%]/g;

export let warning = (type: string, errors: string[]) => {};

// don't print warning message when in production env or node runtime
if (
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV !== 'production' &&
  typeof window !== 'undefined' &&
  typeof document !== 'undefined'
) {
  warning = (type, errors) => {
    if (typeof console !== 'undefined' && console.warn) {
      if (errors.every(e => typeof e === 'string')) {
        console.warn(type, errors);
      }
    }
  };
}

export function convertFieldsError(errors: ErrorList) {
  if (!errors || !errors.length) return null;
  const fields: FieldErrorList = {};
  errors.forEach((error) => {
    const field = error.field;
    fields[field] = fields[field] || [];
    fields[field].push(error);
  });
  return fields;
}

export function format(...args: any[]): string {
  let i = 1;
  const f = args[0];
  const len = args.length;
  if (typeof f === 'function') {
    return f.apply(null, args.slice(1));
  }
  if (typeof f === 'string') {
    let str = String(f).replace(formatRegExp, (x) => {
      if (x === '%%') {
        return '%';
      }
      if (i >= len) {
        return x;
      }
      switch (x) {
        case '%s':
          return String(args[i++]);
        case '%d':
          return Number(args[i++]) + '';
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }
        default:
          return x;
      }
    });
    return str;
  }
  return f;
}

function isNativeStringType(type: string) {
  return (
    type === 'string' ||
    type === 'url' ||
    type === 'hex' ||
    type === 'email' ||
    type === 'date' ||
    type === 'pattern'
  );
}

export function isEmptyValue(value: any, type?: string) {
  if (value === undefined || value === null) {
    return true;
  }
  if (type === 'array' && Array.isArray(value) && !value.length) {
    return true;
  }
  if (isNativeStringType(type!) && typeof value === 'string' && !value) {
    return true;
  }
  return false;
}

export function isEmptyObject(obj: object) {
  return Object.keys(obj).length === 0;
}

function asyncParallelArray(arr: SeriesItem[], func: HandleFunc, callback: (results: ErrorList) => void) {
  const results: ErrorList = [];
  let total = 0;
  const arrLength = arr.length;

  function count(errors: ErrorList | null) {
    results.push.apply(results, errors!);
    total++;
    if (total === arrLength) {
      callback(results);
    }
  }

  arr.forEach(a => {
    func(a, count);
  });
}

function asyncSerialArray(arr: SeriesItem[], func: HandleFunc, callback: (errors: ErrorList) => void) {
  let index = 0;
  const arrLength = arr.length;

  function next(errors: ErrorList | null) {
    if (errors && errors.length) {
      callback(errors);
      return;
    }
    const original = index;
    index = index + 1;
    if (original < arrLength) {
      func(arr[original], next);
    } else {
      callback([]);
    }
  }

  next([]);
}

function flattenObjArr(objArr: Series) {
  const ret: SeriesItem[] = [];
  Object.keys(objArr).forEach(k => {
    ret.push.apply(ret, objArr[k]);
  });
  return ret;
}

export class AsyncValidationError extends Error {
  errors: ErrorList;
  fields: { [field: string]: ErrorList } | null;
  constructor(errors: ErrorList, fields: { [field: string]: ErrorList } | null) {
    super('Async Validation Error');
    this.errors = errors;
    this.fields = fields;
  }
}

export function asyncMap(objArr: Series, option: ValidateOption, func: HandleFunc, callback: (errors: ErrorList) => void): Promise<void> {
  if (option.first) {
    const pending = new Promise<void>((resolve, reject) => {
      const next = (errors: ErrorList) => {
        callback(errors);
        return errors.length
          ? reject(new AsyncValidationError(errors, convertFieldsError(errors)))
          : resolve();
      };
      const flattenArr = flattenObjArr(objArr);
      asyncSerialArray(flattenArr, func, next);
    });
    pending.catch(e => e);
    return pending;
  }
  let firstFields = option.firstFields || [];
  if (firstFields === true) {
    firstFields = Object.keys(objArr);
  }
  const objArrKeys = Object.keys(objArr);
  const objArrLength = objArrKeys.length;
  let total = 0;
  const results: ErrorList = [];
  const pending = new Promise<void>((resolve, reject) => {
    const next = (errors: ErrorList) => {
      results.push.apply(results, errors);
      total++;
      if (total === objArrLength) {
        callback(results);
        return results.length
          ? reject(
              new AsyncValidationError(results, convertFieldsError(results)),
            )
          : resolve();
      }
    };
    if (!objArrKeys.length) {
      callback(results);
      resolve();
    }
    objArrKeys.forEach(key => {
      const arr = objArr[key];
      if ((firstFields as string[]).indexOf(key) !== -1) {
        asyncSerialArray(arr, func, next);
      } else {
        asyncParallelArray(arr, func, next);
      }
    });
  });
  pending.catch(e => e);
  return pending;
}

export function complementError(rule: RuleItem) {
  return (oe: any): ValidateError => {
    // if (typeof oe === 'object' && oe.message) {
    //   oe.field = oe.field || rule.fullField;
    //   return oe;
    // }
    return {
      message: typeof oe === 'function' ? oe() : oe,
      field: oe.field || rule.fullField,
      rule
    };
  };
}

export function deepMerge(target: any, source: any) {
  if (source) {
    for (const s in source) {
      if (source.hasOwnProperty(s)) {
        const value = source[s];
        if (typeof value === 'object' && typeof target[s] === 'object') {
          target[s] = {
            ...target[s],
            ...value,
          };
        } else {
          target[s] = value;
        }
      }
    }
  }
  return target;
}
