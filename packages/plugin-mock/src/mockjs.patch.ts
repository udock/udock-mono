import Mock, { MockjsToJSONSchemaRs } from 'mockjs'

interface MockjsValidEx {
  Diff: any;
  Assert: any;
}

const valid = Mock.valid as any as MockjsValidEx
let _items = valid.Diff.items

valid.Diff.items = function (schema: MockjsToJSONSchemaRs, data: object, name: string, result: object[]) {
  let ret = _items.call(valid.Diff.items, schema, data, name, result)
  if (ret && (schema.rule as { count: number }).count === 1) {
    let isMatched = false
    for (var i=0,n=schema.items!.length; i<n; i++) {
      var it = schema.items![i]
      if (Mock.valid(it.template, data).length === 0) {
        isMatched = true
        break
      }
    }
    if (!isMatched) {
      valid.Assert.equal('equal', schema.path, data, schema.template, result)
    }
  }
  return ret
}
