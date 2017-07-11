(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('casualtyVisuService', casualtyVisuService);

    /* @ngInject */
    function casualtyVisuService($q, $translate, _, AdvancedSparqlService,
            personMapperService, casualtyFacetService, PREFIXES, ENDPOINT_URL) {

        // Get the results based on facet selections.
        // Return a promise.

        this.getResultsAge = getResultsAge;
        this.getResultsPath = getResultsPath;

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

        var queryPath = PREFIXES +
            ' SELECT ?birthplace ?cemetery (COUNT(?id) as ?count) WHERE {' +
            '   ?id m_schema:synnyinkunta ?birthplace_id .' +
            '   ?birthplace_id skos:prefLabel ?birthplace .' +
            '   ?id m_schema:asuinkunta ?residence .' +
            '   ?id m_schema:kuolinkunta ?death .' +
            '   ?id m_schema:hautausmaa ?cemetery_id .' +
            '   ?cemetery_id skos:prefLabel ?cemetery .' +
            ' } GROUP BY ?birthplace ?cemetery' +
            ' LIMIT 10';

        var endpoint = new AdvancedSparqlService(ENDPOINT_URL, personMapperService);

        function getResultsAge(facetSelections) {
            var q = queryAge.replace('<RESULT_SET>', facetSelections.constraint.join(' '));
            return endpoint.getObjectsNoGrouping(q);
        }

        function getResultsPath(facetSelections) {
            var q = queryPath.replace('<RESULT_SET>', facetSelections.constraint.join(' '));
            return endpoint.getObjectsNoGrouping(q);
        }

    }
})();
