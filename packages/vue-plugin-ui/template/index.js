import udockConfig from '@udock/vue-plugin-ui/dist/lib/config-loader.js!@/udock.config.js'<% for (component in components) { %>
import <%= component %> from '@udock/vue-plugin-ui--<%= component %>'
import '@udock/vue-plugin-ui--<%= component %>/src/scss/index.scss'<% } %>

const config = udockConfig.plugins.ui.components
export default function (app, options) {<% for (const component in components) { %>
  app.use(<%= component %>, { ...options, ...config.<%= component %> })<% } %>
}
