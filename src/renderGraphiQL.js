/* @flow */
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

type Bookmark = {
  title: string,
  query: string
}

type Image = {
  src: string,
  width: number,
  height: number
}

type GraphiQLOptions = {
  logo?: ?Image,
  bookmarks?: ?Array<Bookmark>
}

type GraphiQLData = {
  query: ?string,
  variables: ?{ [name: string]: mixed },
  operationName: ?string,
  result?: mixed,
  options?: ?GraphiQLOptions
};

// Current latest version of GraphiQL.
const GRAPHIQL_VERSION = '0.11.2';

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
export function renderGraphiQL(data: GraphiQLData): string {
  const queryString = data.query;
  const variablesString = data.variables
    ? JSON.stringify(data.variables, null, 2)
    : null;
  const resultString = data.result
    ? JSON.stringify(data.result, null, 2)
    : null;
  const operationName = data.operationName;
  const options = data.options;
  const logo = options.logo;
  const bookmarks = options.bookmarks || [];

  /* eslint-disable max-len */
  return `<!--
The request to this GraphQL server provided the header "Accept: text/html"
and as a result has been presented GraphiQL - an in-browser IDE for
exploring GraphQL.

If you wish to receive JSON, provide the header "Accept: application/json" or
add "&raw" to the end of the URL within a browser.
-->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <meta name="robots" content="noindex" />
  <style>
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
  </style>
  <link href="//cdn.jsdelivr.net/npm/graphiql@${GRAPHIQL_VERSION}/graphiql.css" rel="stylesheet" />
  <script src="//cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/15.4.2/react.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/15.4.2/react-dom.min.js"></script>
  <script src="//cdn.jsdelivr.net/npm/graphiql@${GRAPHIQL_VERSION}/graphiql.min.js"></script>
</head>
<body>
  <script>
    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });

    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).filter(function (key) {
        return Boolean(params[key]);
      }).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }

    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };

    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    var fetchURL = locationQuery(otherParams);

    // Defines a GraphQL fetcher using the fetch API.
    function graphQLFetcher(graphQLParams) {
      return fetch(fetchURL, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function (response) {
        return response.text();
      }).then(function (responseBody) {
        try {
          return JSON.parse(responseBody);
        } catch (error) {
          return responseBody;
        }
      });
    }

    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      updateURL();
    }

    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      updateURL();
    }

    function onEditOperationName(newOperationName) {
      parameters.operationName = newOperationName;
      updateURL();
    }

    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }

    // Render <GraphiQL /> into the body.
    var graphiql
    var logo = ${safeSerialize(logo)}
    var prettifyButton = React.createElement(GraphiQL.ToolbarButton, {
      onClick: function () {
        graphiql.handlePrettifyQuery.call(graphiql, arguments)
      },
      title: "Prettify Query",
      label: "Prettify"
    })

    var historyButton = React.createElement(GraphiQL.ToolbarButton, {
      onClick: function () {
        graphiql.handleToggleHistory.call(graphiql, arguments)
      },
      title: "Show History",
      label: "History"
    })

    var bookmarkOpts = ${safeSerialize(bookmarks)}
    var bookmarks = bookmarkOpts.items.map(function (bookmark) {
      return renderBookmark(bookmark, bookmarkOpts)
    })

    var bookmarksMenuTitle = bookmarkOpts.title || 'Bookmarks'
    var bookmarksMenu = bookmarks.length && React.createElement(GraphiQL.Menu, {
      title: bookmarksMenuTitle,
      label: bookmarksMenuTitle
    }, bookmarks)

    var customComponents = []
    if (logo) customComponents.push(renderLogo(logo))

    var toolbarItems = []
    if (bookmarksMenu) toolbarItems.push(bookmarksMenu)

    var toolbar = React.createElement(GraphiQL.Toolbar, {}, [
      prettifyButton,
      historyButton,
      bookmarksMenu
    ])

    customComponents.push(toolbar)

    function renderBookmark (bookmark, opts) {
      return React.createElement(GraphiQL.MenuItem, {
        title: bookmark.title,
        label: bookmark.title,
        onSelect: function () {
          graphiql.getQueryEditor().setValue(bookmark.query)
          // if (opts.autorun) {
          //   graphiql.handleRunQuery()
          // }
        }
      })
    }

    function renderLogo (image) {
      return React.createElement(GraphiQL.Logo, {}, [
        React.createElement('img', image)
      ])
    }

    ReactDOM.render(
      React.createElement(GraphiQL, {
        ref: g => graphiql = g,
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        query: ${safeSerialize(queryString)},
        response: ${safeSerialize(resultString)},
        variables: ${safeSerialize(variablesString)},
        operationName: ${safeSerialize(operationName)}
      }, customComponents),
      document.body
    );
  </script>
</body>
</html>`;
}
