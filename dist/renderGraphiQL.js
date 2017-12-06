'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderGraphiQL = renderGraphiQL;


// Current latest version of GraphiQL.

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

var GRAPHIQL_VERSION = '0.11.2';

// Ensures string values are safe to be used within a <script> tag.
function safeSerialize(data) {
  return data ? JSON.stringify(data).replace(/\//g, '\\/') : 'undefined';
}

/**
 * When express-graphql receives a request which does not Accept JSON, but does
 * Accept HTML, it may present GraphiQL, the in-browser GraphQL explorer IDE.
 *
 * When shown, it will be pre-populated with the result of having executed the
 * requested query.
 */
function renderGraphiQL(data) {
  var queryString = data.query;
  var variablesString = data.variables ? JSON.stringify(data.variables, null, 2) : null;
  var resultString = data.result ? JSON.stringify(data.result, null, 2) : null;
  var operationName = data.operationName;
  var options = data.options;
  var logo = options.logo;
  var bookmarks = options.bookmarks || [];

  /* eslint-disable max-len */
  return '<!--\nThe request to this GraphQL server provided the header "Accept: text/html"\nand as a result has been presented GraphiQL - an in-browser IDE for\nexploring GraphQL.\n\nIf you wish to receive JSON, provide the header "Accept: application/json" or\nadd "&raw" to the end of the URL within a browser.\n-->\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8" />\n  <title>GraphiQL</title>\n  <meta name="robots" content="noindex" />\n  <style>\n    html, body {\n      height: 100%;\n      margin: 0;\n      overflow: hidden;\n      width: 100%;\n    }\n  </style>\n  <link href="//cdn.jsdelivr.net/npm/graphiql@' + GRAPHIQL_VERSION + '/graphiql.css" rel="stylesheet" />\n  <script src="//cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js"></script>\n  <script src="//cdn.jsdelivr.net/react/15.4.2/react.min.js"></script>\n  <script src="//cdn.jsdelivr.net/react/15.4.2/react-dom.min.js"></script>\n  <script src="//cdn.jsdelivr.net/npm/graphiql@' + GRAPHIQL_VERSION + '/graphiql.min.js"></script>\n</head>\n<body>\n  <script>\n    // Collect the URL parameters\n    var parameters = {};\n    window.location.search.substr(1).split(\'&\').forEach(function (entry) {\n      var eq = entry.indexOf(\'=\');\n      if (eq >= 0) {\n        parameters[decodeURIComponent(entry.slice(0, eq))] =\n          decodeURIComponent(entry.slice(eq + 1));\n      }\n    });\n\n    // Produce a Location query string from a parameter object.\n    function locationQuery(params) {\n      return \'?\' + Object.keys(params).filter(function (key) {\n        return Boolean(params[key]);\n      }).map(function (key) {\n        return encodeURIComponent(key) + \'=\' +\n          encodeURIComponent(params[key]);\n      }).join(\'&\');\n    }\n\n    // Derive a fetch URL from the current URL, sans the GraphQL parameters.\n    var graphqlParamNames = {\n      query: true,\n      variables: true,\n      operationName: true\n    };\n\n    var otherParams = {};\n    for (var k in parameters) {\n      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {\n        otherParams[k] = parameters[k];\n      }\n    }\n    var fetchURL = locationQuery(otherParams);\n\n    // Defines a GraphQL fetcher using the fetch API.\n    function graphQLFetcher(graphQLParams) {\n      return fetch(fetchURL, {\n        method: \'post\',\n        headers: {\n          \'Accept\': \'application/json\',\n          \'Content-Type\': \'application/json\'\n        },\n        body: JSON.stringify(graphQLParams),\n        credentials: \'include\',\n      }).then(function (response) {\n        return response.text();\n      }).then(function (responseBody) {\n        try {\n          return JSON.parse(responseBody);\n        } catch (error) {\n          return responseBody;\n        }\n      });\n    }\n\n    // When the query and variables string is edited, update the URL bar so\n    // that it can be easily shared.\n    function onEditQuery(newQuery) {\n      parameters.query = newQuery;\n      updateURL();\n    }\n\n    function onEditVariables(newVariables) {\n      parameters.variables = newVariables;\n      updateURL();\n    }\n\n    function onEditOperationName(newOperationName) {\n      parameters.operationName = newOperationName;\n      updateURL();\n    }\n\n    function updateURL() {\n      history.replaceState(null, null, locationQuery(parameters));\n    }\n\n    // Render <GraphiQL /> into the body.\n    var graphiql\n    var logo = ' + safeSerialize(logo) + '\n    var prettifyButton = React.createElement(GraphiQL.ToolbarButton, {\n      onClick: function () {\n        graphiql.handlePrettifyQuery.call(graphiql, arguments)\n      },\n      title: "Prettify Query",\n      label: "Prettify"\n    })\n\n    var historyButton = React.createElement(GraphiQL.ToolbarButton, {\n      onClick: function () {\n        graphiql.handleToggleHistory.call(graphiql, arguments)\n      },\n      title: "Show History",\n      label: "History"\n    })\n\n    var bookmarkOpts = ' + safeSerialize(bookmarks) + '\n    var bookmarks = bookmarkOpts.items.map(function (bookmark) {\n      return renderBookmark(bookmark, bookmarkOpts)\n    })\n\n    var bookmarksMenuTitle = bookmarkOpts.title || \'Bookmarks\'\n    var bookmarksMenu = bookmarks.length && React.createElement(GraphiQL.Menu, {\n      title: bookmarksMenuTitle,\n      label: bookmarksMenuTitle\n    }, bookmarks)\n\n    var customComponents = []\n    if (logo) customComponents.push(renderLogo(logo))\n\n    var toolbarItems = []\n    if (bookmarksMenu) toolbarItems.push(bookmarksMenu)\n\n    var toolbar = React.createElement(GraphiQL.Toolbar, {}, [\n      prettifyButton,\n      historyButton,\n      bookmarksMenu\n    ])\n\n    customComponents.push(toolbar)\n\n    function renderBookmark (bookmark, opts) {\n      return React.createElement(GraphiQL.MenuItem, {\n        title: bookmark.title,\n        label: bookmark.title,\n        onSelect: function () {\n          graphiql.getQueryEditor().setValue(bookmark.query)\n          // if (opts.autorun) {\n          //   graphiql.handleRunQuery()\n          // }\n        }\n      })\n    }\n\n    function renderLogo (image) {\n      return React.createElement(GraphiQL.Logo, {}, [\n        React.createElement(\'img\', image)\n      ])\n    }\n\n    ReactDOM.render(\n      React.createElement(GraphiQL, {\n        ref: g => graphiql = g,\n        fetcher: graphQLFetcher,\n        onEditQuery: onEditQuery,\n        onEditVariables: onEditVariables,\n        onEditOperationName: onEditOperationName,\n        query: ' + safeSerialize(queryString) + ',\n        response: ' + safeSerialize(resultString) + ',\n        variables: ' + safeSerialize(variablesString) + ',\n        operationName: ' + safeSerialize(operationName) + '\n      }, customComponents),\n      document.body\n    );\n  </script>\n</body>\n</html>';
}