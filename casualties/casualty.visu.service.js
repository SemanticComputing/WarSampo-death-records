(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('casualtyVisuService', casualtyVisuService);

    /* @ngInject */
    function casualtyVisuService($q, $translate, _, AdvancedSparqlService,
            personMapperService, casualtyFacetService, PREFIXES, ENDPOINT_URL) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        this.getResultsAge = getResultsAge;

        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = casualtyFacetService.getFacets;

        // Get the facet options.
        // Return an object.
        this.getFacetOptions = casualtyFacetService.getFacetOptions;

        /* Implementation */

        var queryAge = PREFIXES +
        '  SELECT ?age (count(DISTINCT ?id) as ?casualties)' +
        '  WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '    ?id m_schema:syntymaeaika ?birth .' +
        '    ?id m_schema:kuolinaika ?death .' +
        '    BIND( year(?death) - year(?birth) - if(month(?death) < month(?birth) || ' +
        '     (month(?death) = month(?birth) && day(?death) < day(?birth)), 1, 0) as ?age )' +
        '  } GROUP BY ?age ORDER BY ?age';

        var endpoint = new AdvancedSparqlService(ENDPOINT_URL, personMapperService);

        function getResultsAge(facetSelections) {
            var q = queryAge.replace('<RESULT_SET>', facetSelections.constraint.join(' '));
            return endpoint.getObjectsNoGrouping(q);
        }

        function getResults(facetSelections, visualizationType) {
            if (visualizationType == 'age') {
                return this.getResultsAge(facetSelections);
            } else {
                return;
            }
        }

    }
})();
