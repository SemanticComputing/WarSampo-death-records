/*
 * Service for building pageable SPARQL queries.
 */
(function() {

    'use strict';

    angular.module('sparql')
    .factory('QueryBuilderService', QueryBuilderService);

    /* Provides a constructor for a query builder.
    /* ngInject */
    function QueryBuilderService() {

        var resultSetQryShell =
        '  SELECT DISTINCT ?id { ' +
        '   <CONTENT> ' +
        '  } ORDER BY <ORDER_BY> <PAGE> ';

        var resultSetShell =
        ' { ' +
        '   <RESULT_SET> ' +
        ' } FILTER(BOUND(?id)) ';

        return QueryBuilder;

        function QueryBuilder(prefixes) {

            return {
                buildQuery : buildQuery
            };

            function buildQuery(queryTemplate, resultSet, orderBy) {
                var resultSetQry = resultSetQryShell
                    .replace('<CONTENT>', resultSet)
                    .replace('<ORDER_BY>', orderBy || '?id');

                var resultSetPart = resultSetShell
                    .replace('<RESULT_SET>', resultSetQry);

                resultSetQry = prefixes + resultSetQry;

                var query = prefixes + queryTemplate.replace('<RESULT_SET>', resultSetPart);

                return {
                    resultSetQuery: resultSetQry,
                    query: query
                };
            }
        }
    }
})();
