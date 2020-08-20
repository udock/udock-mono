<%
var _components = []
function recursiveRoutes (routes, tab, components) {
  var res = ''
  routes.forEach(function (route, i) {
    route._name = '_' + hash(route.component)
    components.push({ _name: route._name, component: route.component, name: route.name })
    res += tab
    if (route.hasExOptions) {res += `Object.assign(require('!${loader}!${route.component}').default, `}
    res += '{\n'
    res += tab + '  path: ' + JSON.stringify(route.path) + ',\n'
    res += tab + '  component: ' + route._name
    // res += (route.name) ? ',\n  ' + tab + 'name: ' + JSON.stringify(route.name) : ''
    res += (route.children) ? ',\n  ' + tab + 'children: [\n' + recursiveRoutes(routes[i].children, tab + '    ', components) + '\n ' + tab + '   ]' : ''
    res += '\n' + tab + '}'
    if (route.hasExOptions) {res += ')'}
    res += (i + 1 === routes.length ? '' : ',\n')
  })
  res = res.replace(/"/g, '\'')
  return res
}
var _routes = recursiveRoutes(router.routes, '', _components)
uniqBy(_components, '_name').forEach(function (route) { %>
const <%= route._name %> = function () { return import('<%= route.component %>' /* webpackChunkName: "modules/<%= route.name %>" */) }
<% }) %>
export default [<%= _routes %>]
