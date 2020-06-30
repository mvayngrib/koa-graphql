'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _graphql = require('graphql');

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _httpErrors = require('http-errors');

var _httpErrors2 = _interopRequireDefault(_httpErrors);

var _renderGraphiQL = require('./renderGraphiQL');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getGraphQLParams = _expressGraphql2.default.getGraphQLParams;

/**
 * Used to configure the graphqlHTTP middleware by providing a schema
 * and other configuration options.
 *
 * Options can be provided as an Object, a Promise for an Object, or a Function
 * that returns an Object or a Promise for an Object.
 */

/**
 * Middleware for express; takes an options object or function as input to
 * configure behavior, and returns an express middleware.
 */
module.exports = graphqlHTTP;
function graphqlHTTP(options) {
  if (!options) {
    throw new Error('GraphQL middleware requires options.');
  }

  return function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(ctx, next) {
      var req, request, response, schema, context, rootValue, pretty, graphiql, formatErrorFn, extensionsFn, showGraphiQL, query, documentAST, variables, operationName, validationRules, result, optionsData, params, payload, _payload;

      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              req = ctx.req;
              request = ctx.request;
              response = ctx.response;

              // Higher scoped variables are referred to at various stages in the
              // asynchronous state machine below.

              schema = void 0;
              context = void 0;
              rootValue = void 0;
              pretty = void 0;
              graphiql = void 0;
              formatErrorFn = void 0;
              extensionsFn = void 0;
              showGraphiQL = void 0;
              query = void 0;
              documentAST = void 0;
              variables = void 0;
              operationName = void 0;
              validationRules = void 0;
              result = void 0;
              _context.prev = 17;
              _context.next = 20;
              return typeof options === 'function' ? options(request, response, ctx) : options;

            case 20:
              optionsData = _context.sent;

              if (!(!optionsData || (typeof optionsData === 'undefined' ? 'undefined' : (0, _typeof3.default)(optionsData)) !== 'object')) {
                _context.next = 23;
                break;
              }

              throw new Error('GraphQL middleware option function must return an options object ' + 'or a promise which will be resolved to an options object.');

            case 23:
              if (optionsData.schema) {
                _context.next = 25;
                break;
              }

              throw new Error('GraphQL middleware options must contain a schema.');

            case 25:

              // Collect information from the options data object.
              schema = optionsData.schema;
              context = optionsData.context || ctx;
              rootValue = optionsData.rootValue;
              pretty = optionsData.pretty;
              graphiql = optionsData.graphiql;
              formatErrorFn = optionsData.formatError;
              extensionsFn = optionsData.extensions;

              validationRules = _graphql.specifiedRules;
              if (optionsData.validationRules) {
                validationRules = validationRules.concat(optionsData.validationRules);
              }

              // GraphQL HTTP only supports GET and POST methods.

              if (!(request.method !== 'GET' && request.method !== 'POST')) {
                _context.next = 37;
                break;
              }

              response.set('Allow', 'GET, POST');
              throw (0, _httpErrors2.default)(405, 'GraphQL only supports GET and POST requests.');

            case 37:

              // Use request.body when req.body is undefined.
              req.body = req.body || request.body;

              // Parse the Request to get GraphQL request parameters.
              _context.next = 40;
              return getGraphQLParams(req);

            case 40:
              params = _context.sent;


              // Get GraphQL params from the request and POST body data.
              query = params.query;
              variables = params.variables;
              operationName = params.operationName;
              showGraphiQL = graphiql && canDisplayGraphiQL(request, params);

              _context.next = 47;
              return new Promise(function (resolve) {
                // If there is no query, but GraphiQL will be displayed, do not produce
                // a result, otherwise return a 400: Bad Request.
                if (!query) {
                  if (showGraphiQL) {
                    return resolve(null);
                  }
                  throw (0, _httpErrors2.default)(400, 'Must provide query string.');
                }

                // GraphQL source.
                var source = new _graphql.Source(query, 'GraphQL request');

                // Parse source to AST, reporting any syntax error.
                try {
                  documentAST = (0, _graphql.parse)(source);
                } catch (syntaxError) {
                  // Return 400: Bad Request if any syntax errors errors exist.
                  response.status = 400;
                  return resolve({ errors: [syntaxError] });
                }

                // Validate AST, reporting any errors.
                var validationErrors = (0, _graphql.validate)(schema, documentAST, validationRules);
                if (validationErrors.length > 0) {
                  // Return 400: Bad Request if any validation errors exist.
                  response.status = 400;
                  return resolve({ errors: validationErrors });
                }

                // Only query operations are allowed on GET requests.
                if (request.method === 'GET') {
                  // Determine if this GET request will perform a non-query.
                  var operationAST = (0, _graphql.getOperationAST)(documentAST, operationName);
                  if (operationAST && operationAST.operation !== 'query') {
                    // If GraphiQL can be shown, do not perform this query, but
                    // provide it to GraphiQL so that the requester may perform it
                    // themselves if desired.
                    if (showGraphiQL) {
                      return resolve(null);
                    }

                    // Otherwise, report a 405: Method Not Allowed error.
                    response.set('Allow', 'POST');
                    throw (0, _httpErrors2.default)(405, 'Can only perform a ' + operationAST.operation + ' operation ' + 'from a POST request.');
                  }
                }

                // Perform the execution, reporting any errors creating the context.
                try {
                  resolve((0, _graphql.execute)(schema, documentAST, rootValue, context, variables, operationName));
                } catch (contextError) {
                  // Return 400: Bad Request if any execution context errors exist.
                  response.status = 400;
                  resolve({ errors: [contextError] });
                }
              });

            case 47:
              result = _context.sent;

              if (!(result && extensionsFn)) {
                _context.next = 52;
                break;
              }

              _context.next = 51;
              return Promise.resolve(extensionsFn({
                document: documentAST,
                variables: variables,
                operationName: operationName,
                result: result
              })).then(function (extensions) {
                if (extensions && (typeof extensions === 'undefined' ? 'undefined' : (0, _typeof3.default)(extensions)) === 'object') {
                  result.extensions = extensions;
                }
                return result;
              });

            case 51:
              result = _context.sent;

            case 52:
              _context.next = 58;
              break;

            case 54:
              _context.prev = 54;
              _context.t0 = _context['catch'](17);

              // If an error was caught, report the httpError status, or 500.
              response.status = _context.t0.status || 500;
              result = { errors: [_context.t0] };

            case 58:

              // If no data was included in the result, that indicates a runtime query
              // error, indicate as such with a generic status code.
              // Note: Information about the error itself will still be contained in
              // the resulting JSON payload.
              // http://facebook.github.io/graphql/#sec-Data
              if (result && result.data === null) {
                response.status = 500;
              }
              // Format any encountered errors.
              if (result && result.errors) {
                result.errors = result.errors.map(formatErrorFn || _graphql.formatError);
              }

              // If allowed to show GraphiQL, present it instead of JSON.
              if (showGraphiQL) {
                payload = (0, _renderGraphiQL.renderGraphiQL)({
                  query: query,
                  variables: variables,
                  operationName: operationName,
                  result: result,
                  options: graphiql
                });

                response.type = 'text/html';
                response.body = payload;
              } else {
                // Otherwise, present JSON directly.
                _payload = pretty ? JSON.stringify(result, null, 2) : result;

                response.type = 'application/json';
                response.body = _payload;
              }

              _context.next = 63;
              return next();

            case 63:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[17, 54]]);
    }));

    function middleware(_x, _x2) {
      return _ref.apply(this, arguments);
    }

    return middleware;
  }();
}

/**
 * Helper function to determine if GraphiQL can be displayed.
 */
function canDisplayGraphiQL(request, params) {
  // If `raw` exists, GraphiQL mode is not enabled.
  // Allowed to show GraphiQL if not requested as raw and this request
  // prefers HTML over JSON.
  return !params.raw && request.accepts(['json', 'html']) === 'html';
}