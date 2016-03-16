/* Service for querying a SPARQL endpoint with paging support.
 * Takes the endpoint URL and a mapper object as parameters.
 * The mapper is an object that maps the SPARQL results to objects.
 * The mapper should provide 'makeObjectList' and 'makeObjectListNoGrouping'
 * functions that take the SPARQL results as parameter and return the mapped objects.
 * */
(function() {

    'use strict';

    angular.module('sparql')
    .factory('AdvancedSparqlService', AdvancedSparqlService);

    /* ngInject */
    function AdvancedSparqlService($http, $q, SparqlService, PagerService) {
        return function(endpointUrl, mapper) {
            var endpoint = new SparqlService(endpointUrl);

            this.getObjects = getObjects;
            this.getObjectsNoGrouping = getObjectsNoGrouping;

            function getObjects(sparqlQry, pageSize, resultSetQry, pagesPerQuery) {
                // Get the results as objects.
                // If pageSize is defined, return a (promise of a) PagerService object, otherwise
                // query the endpoint and return the results as a promise.
                if (pageSize) {
                    return $q.when(new PagerService(sparqlQry, resultSetQry, pageSize,
                            getResultsWithGrouping, pagesPerQuery));
                }
                // Query the endpoint.
                return getResultsWithGrouping(sparqlQry.replace('<PAGE>', ''));
            }

            function getObjectsNoGrouping(sparqlQry, pageSize) {
                // Get the results as objects but call 'makeObjectListNoGrouping' instead
                // (i.e. treat each result as a separate object and don't group by id).
                // If pageSize is defined, return a (promise of a) PagerService object, otherwise
                // query the endpoint and return the results as a promise.
                if (pageSize) {
                    return $q.when(new PagerService(sparqlQry, pageSize, getResultsNoGrouping));
                }
                // Query the endpoint.
                return getResultsNoGrouping(sparqlQry.replace('<PAGE>', ''));
            }

            function getResultsWithGrouping(sparqlQry, raw) {
                var promise = endpoint.getObjects(sparqlQry);
                if (raw) {
                    return promise;
                }
                return promise.then(function(data) {
                    return mapper.makeObjectList(data);
                });
            }

            function getResultsNoGrouping(sparqlQry, raw) {
                var promise = endpoint.getObjects(sparqlQry);
                if (raw) {
                    return promise;
                }
                return promise.then(function(data) {
                    return mapper.makeObjectListNoGrouping(data);
                });
            }
        };
    }
})();
