(function() {
    'use strict';

    angular.module('sparql', []);
})();

/*
* Service for querying a SPARQL endpoint.
* Takes the endpoint URL as a parameter.
*/
(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('sparql')

    .factory('SparqlService', SparqlService);

    /* ngInject */
    function SparqlService($http, $q) {
        return function(endpointUrl) {

            var executeQuery = function(sparqlQry) {
                return $http.get(endpointUrl + '?query=' + encodeURIComponent(sparqlQry) + '&format=json');
            };

            return {
                getObjects: function(sparqlQry) {
                    // Query the endpoint and return a promise of the bindings.
                    return executeQuery(sparqlQry).then(function(response) {
                        return response.data.results.bindings;
                    }, function(response) {
                        return $q.reject(response.data);
                    });
                }
            };
        };
    }
})();

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

(function() {
    'use strict';

    /*
    * Service for transforming SPARQL result triples into more manageable objects.
    *
    * Author Erkki Heino.
    */
    /* eslint-disable angular/no-service-method */
    angular.module('sparql')

    .constant('_', _) // eslint-disable-line no-undef

    .service('objectMapperService', objectMapperService);

    /* ngInject */
    function objectMapperService(_) {
        ObjectMapper.prototype.makeObject = makeObject;
        ObjectMapper.prototype.mergeObjects = mergeObjects;
        ObjectMapper.prototype.postProcess = postProcess;
        ObjectMapper.prototype.makeObjectList = makeObjectList;
        ObjectMapper.prototype.makeObjectListNoGrouping = makeObjectListNoGrouping;

        return new ObjectMapper();

        function ObjectMapper() {
            this.objectClass = Object;
        }


        function makeObject(obj) {
            // Flatten the obj. Discard everything except values.
            // Assume that each property of the obj has a value property with
            // the actual value.
            var o = new this.objectClass();

            _.forIn(obj, function(value, key) {
                o[key] = value.value;
            });

            return o;
        }


        function mergeObjects(first, second) {
            // Merge two objects into one object.
            return _.mergeWith(first, second, function(a, b) {
                if (_.isEqual(a, b)) {
                    return a;
                }
                if (_.isArray(a)) {
                    if (_.isArray(b)) {
                        var res = [];
                        a.concat(b).forEach(function(val) {
                            var value = _.find(res, function(earlierVal) {
                                return _.isEqual(val, earlierVal);
                            });
                            if (!value) {
                                res.push(val);
                            }
                        });
                        return res;
                    }
                    if (_.find(a, function(val) { return _.isEqual(val, b); })) {
                        return a;
                    }
                    return a.concat(b);
                }
                if (a && !b) {
                    return a;
                }
                if (b && !a) {
                    return b;
                }
                if (_.isArray(b)) {
                    return b.concat(a);
                }

                return [a, b];
            });
        }

        function postProcess(objects) {
            return objects;
        }

        function makeObjectList(objects) {
            // Create a list of the SPARQL results where triples with the same
            // subject are merged into one object.
            var self = this;
            var obj_list = _.transform(objects, function(result, obj) {
                if (!obj.id) {
                    return null;
                }
                obj = self.makeObject(obj);
                // Check if this object has been constructed earlier
                var old = _.find(result, function(e) {
                    return e.id === obj.id;
                });
                if (old) {
                    // Merge this triple into the object constructed earlier
                    self.mergeObjects(old, obj);
                }
                else {
                    // This is the first triple related to the id
                    result.push(obj);
                }
            });
            return self.postProcess(obj_list);
        }

        function makeObjectListNoGrouping(objects) {
            // Create a list of the SPARQL results where each triple is treated
            // as a separated object.
            var self = this;
            var obj_list = _.transform(objects, function(result, obj) {
                obj = self.makeObject(obj);
                result.push(obj);
            });
            return obj_list;
        }
    }
})();

/*
 * Service for paging SPARQL results.
 *
 * TODO: Fix race condition problem when changing the page size (perhaps don't
 *      allow it at all without a new instantiation?)
 */
(function() {

    'use strict';

    angular.module('sparql')
    .factory('PagerService', PagerService);

    /* Provides a constructor for a pager.
     *
     * Parameters:
     *
     * sparqlQry is the SPARQL query for the results (with a <PAGE> place holder
     * for where the paging should happen).
     *
     * resultSetQry is the result set subquery part of the query - i.e. the part which
     * defines the distinct objects that are being paged (with the <PAGE> place holder).
     *
     * itemsPerPage is the size of a single page.
     *
     * getResults is a function that returns a promise of results given a
     * SPARQL query.
     *
     * pagesPerQuery is the number of pages fetched (and cached) per each page request.
     * Optional, defaults to 1.
     *
     * itemCount is the total number of items that the sparqlQry returns.
     * Optional, will be queried based on the resultSetQry if not given.
     *
    /* ngInject */
    function PagerService($q, _) {
        return function(sparqlQry, resultSetQry, itemsPerPage, getResults, pagesPerQuery, itemCount) {

            var self = this;

            /* Public API */

            // getTotalCount() -> promise
            self.getTotalCount = getTotalCount;
            // getMaxPageNo() -> promise
            self.getMaxPageNo = getMaxPageNo;
            // getPage(pageNumber) -> promise
            self.getPage = getPage;
            // getAllSequentially() -> promise
            self.getAllSequentially = getAllSequentially;

            // How many pages to get with one query.
            self.pagesPerQuery = pagesPerQuery || 1;

            /* Internal vars */

            // The total number of items.
            var count = itemCount || undefined;
            // The number of the last page.
            var maxPage = count ? calculateMaxPage(count, pageSize) : undefined;
            // Cached pages.
            var pages = [];

            var pageSize = itemsPerPage;

            var countQry = countify(resultSetQry.replace('<PAGE>', ''));

            /* Public API function definitions */

            function getPage(pageNo, size) {
                // Get a specific "page" of data.
                // Currently prone to race conditions when using the size
                // parameter to change the page size.

                if (size && size !== pageSize) {
                    // Page size change. Clear page cache.
                    // This part is problematic if the function is called
                    // multiple times in short succession.
                    pageSize = size;
                    pages = [];
                }

                // Get cached page if available.
                if (pages[pageNo]) {
                    return pages[pageNo].promise;
                }
                if (pageNo < 0) {
                    return $q.when([]);
                }
                return getTotalCount().then(function() {
                    if (pageNo > maxPage || !count) {
                        return $q.when([]);
                    }
                    // Get the page window for the query (i.e. query for surrounding
                    // pages as well according to self.pagesPerQuery).
                    var start = getPageWindowStart(pageNo);
                    // Assign a promise to each page within the window as all of those
                    // will be fetched.
                    for (var i = start; i < start + self.pagesPerQuery && i <= maxPage; i++) {
                        if (!pages[i]) {
                            pages[i] = $q.defer();
                        }
                    }
                    // Query for the pages.
                    return getResults(pagify(sparqlQry, start, pageSize, self.pagesPerQuery))
                    .then(function(results) {
                        var chunks = _.chunk(results, pageSize);
                        chunks.forEach(function(page) {
                            // Resolve each page promise.
                            pages[start].resolve(page);
                            start++;
                        });
                        // Return (the promise of) the requested page.
                        return pages[pageNo].promise;
                    });
                });
            }

            function getAllSequentially(chunkSize) {
                // Get all of the data in chunks sequentially.
                var all = [];
                var res = $q.defer();
                var chain = $q.when();
                return getTotalCount().then(function(count) {
                    var max = Math.ceil(count / chunkSize);
                    var j = 0;
                    for (var i = 0; i < max; i++) {
                        chain = chain.then(function() {
                            return getResults(pagify(sparqlQry, j++, chunkSize, 1)).then(function(page) {
                                all = all.concat(page);
                                res.notify(all);
                            });
                        });
                    }
                    chain.then(function() {
                        res.resolve(all);
                    });

                    return res.promise;
                });
            }

            function getTotalCount() {
                // Get the total number of items that the result set query returns.
                // Returns a promise.

                // Get cached count if available.
                if (count) {
                    maxPage = calculateMaxPage(count, pageSize);
                    return $q.when(count);
                }
                return getResults(countQry, true).then(function(results) {
                    // Cache the count.
                    count = parseInt(results[0].count.value);
                    maxPage = calculateMaxPage(count, pageSize);
                    return count;
                });
            }

            function getMaxPageNo() {
                return getTotalCount().then(function(count) {
                    return calculateMaxPage(count, pageSize);
                });
            }

            /* Internal helper functions */

            function pagify(sparqlQry, page, pageSize, pagesPerQuery) {
                // Form the query for the given page.
                var query = sparqlQry.replace('<PAGE>',
                        ' LIMIT ' + pageSize * pagesPerQuery + ' OFFSET ' + (page * pageSize));
                return query;
            }

            function countify(sparqlQry) {
                // Form a query that counts the total number of items returned
                // by the query (by replacing the first SELECT with a COUNT).
                return sparqlQry.replace(/(\bselect\b.+?(where)?\W+?\{)/i,
                    'SELECT (COUNT(DISTINCT ?id) AS ?count) WHERE { $1 ') + ' }';
            }

            function getPageWindowStart(pageNo) {
                // Get the page number of the first page to fetch.

                if (pageNo <= 0) {
                    // First page.
                    return 0;
                }
                if (pageNo >= maxPage) {
                    // Last page -> window ends on last page.
                    return Math.max(pageNo - self.pagesPerQuery + 1, 0);
                }
                var minMin = pageNo < self.pagesPerQuery ? 0 : pageNo - self.pagesPerQuery;
                var maxMax = pageNo + self.pagesPerQuery > maxPage ? maxPage : pageNo + self.pagesPerQuery;
                var min, max;
                for (min = minMin; min <= pageNo; min++) {
                    // Get the lowest non-cached page within the extended window.
                    if (!pages[min]) {
                        break;
                    }
                }
                if (min === pageNo) {
                    // No non-cached pages before the requested page within the extended window.
                    return pageNo;
                }
                for (max = maxMax; max > pageNo; max--) {
                    // Get the highest non-cached page within the extended window.
                    if (!pages[max]) {
                        break;
                    }
                }
                if (minMin === min && maxMax === max) {
                    // No cached pages near the requested page
                    // -> requested page in the center of the window
                    return min + Math.ceil(self.pagesPerQuery / 2);
                }
                if (max < maxMax) {
                    // There are some cached pages toward the end of the extended window
                    // -> window ends at the last non-cached page
                    return Math.max(max - self.pagesPerQuery + 1, 0);
                }
                // Otherwise window starts from the lowest non-cached page
                // within the extended window.
                return min;
            }

            function calculateMaxPage(count, pageSize) {
                return Math.ceil(count / pageSize) - 1;
            }

        };
    }
})();

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
