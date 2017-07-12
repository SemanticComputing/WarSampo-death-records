(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('casualtyVisuService', casualtyVisuService);

    /* @ngInject */
    function casualtyVisuService($q, $translate, _, AdvancedSparqlService,
            personMapperService, casualtyFacetService, placeRepository, PREFIXES, ENDPOINT_CONFIG) {

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
            ' SELECT ?from ?to ?level (COUNT(?id) as ?count) WHERE {' +
            '   {' +
            '     { ' +
            '       <RESULT_SET> ' +
            '     } ' +
            '     OPTIONAL { ?id m_schema:synnyinkunta ?from . }' +
            '     OPTIONAL { ?id m_schema:asuinkunta ?to . }' +
            '     BIND(0 as ?level)' +
            '   } UNION {' +
            '     { ' +
            '       <RESULT_SET> ' +
            '     } ' +
            '     OPTIONAL { ?id m_schema:asuinkunta ?from . }' +
            '     OPTIONAL { ?id m_schema:kuolinkunta ?to . }' +
            '     BIND(1 as ?level)' +
            '   } UNION {' +
            '     { ' +
            '       <RESULT_SET> ' +
            '     } ' +
            '     OPTIONAL { ?id m_schema:kuolinkunta ?from . }' +
            '     OPTIONAL { ?id m_schema:hautausmaa ?to . }' +
            '     BIND(2 as ?level)' +
            '   }' +
            ' } GROUP BY ?from ?to ?level';

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, personMapperService);

        function getResultsAge(facetSelections) {
            var q = queryAge.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return endpoint.getObjectsNoGrouping(q).then( function(res) {
                return _.map(res, function(obj) {
                    return { c: [{ v: parseInt(obj.age)}, { v: parseInt(obj.casualties) }] };
                });
            });
        }

        function mapPlaceNames(original, places) {
            var placeDict = _.keyBy(places, 'id');
            return _.map(original, function(row) {
                var res = {};
                ['from', 'to'].forEach( function(attr) {
                    if (row[attr]) {
                        res[attr] = placeDict[row[attr]].label;
                    } else {
                        res[attr] = '?';
                    }
                    // Google sankey requires unique labels, so add some whitespace based on level
                    res[attr] += _.repeat(' ', parseInt(row.level) + (attr === 'to' ? 1 : 0));
                });
                res.count = row.count;
                return res;
            });
        }

        function getResultsPath(facetSelections) {
            var q = queryPath.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return endpoint.getObjectsNoGrouping(q).then( function(res) {
                var ids = _.uniq(_.flatten(_.map(res, function(obj) {
                    return _.compact([obj.from, obj.to]);
                } )));
                return placeRepository.getById(ids).then( function(places) {
                    var mappedRows = mapPlaceNames(res, places);

                    return _.transform( mappedRows, function(data, row) {
                        data.push({ c: [{ v: row.from }, { v: row.to }, { v: parseInt(row.count) }] });
                    }, []);

                });
            });
        }
    }
})();
