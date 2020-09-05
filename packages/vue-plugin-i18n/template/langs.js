export default {
<% for (let lang of langs) { %>  '<%= lang.name %>': <% if (lang.lazy) {%>() => import('./<%= lang.name %>' /* webpackChunkName: "<%= chunkNameBase %>/lang_<%= lang.name %>" */ )<%}
else {%>require('./<%= lang.name %>').default<%}%>,
<% } %>}
