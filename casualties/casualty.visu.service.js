(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('casualtyVisuService', casualtyVisuService);

    /* @ngInject */
    function casualtyVisuService($q, $translate, _, AdvancedSparqlService,
            personMapperService, baseRepository, PREFIXES, ENDPOINT_CONFIG) {

        var self = this;

        self.getResultsAge = getResultsAge;
        self.getResultsBarChart = getResultsBarChart;
        self.getResultsPath = getResultsPath;

        /* Implementation */

        var queryAge = PREFIXES +
        '  SELECT ?age (count(DISTINCT ?id) as ?casualties)' +
        '  WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '  ?id m_schema:syntymaeaika ?birth .' +
        '  ?id m_schema:kuolinaika ?death .' +
        '  BIND( year(?death) - year(?birth) - if(month(?death) < month(?birth) || ' +
        '   (month(?death) = month(?birth) && day(?death) < day(?birth)), 1, 0) as ?age )' +
        '  } GROUP BY ?age ORDER BY ?age';

        var queryBarChart = PREFIXES +
        '  SELECT ?var (count(DISTINCT ?id) as ?casualties)' +
        '  WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '  ?id <PREDICATE> ?var . ' +
        '  } GROUP BY ?var ORDER BY DESC(?casualties)';

        var pathPart =
        ' { ' +
        '   { ' +
        '     <RESULT_SET> ' +
        '   } ' +
        '   OPTIONAL { ?id <FROM> ?from . }' +
        '   OPTIONAL { ?id <TO> ?to . }' +
        '   BIND(<LEVEL> as ?level)' +
        ' } ';

        var queryPath = PREFIXES +
        ' SELECT ?from ?to ?level (COUNT(?id) as ?count) WHERE {' +
        '   <PATH> ' +
        ' } GROUP BY ?from ?to ?level';

        function getPathQuery(path) {
            var paths = [];
            var level = 0;
            var pairs = [];
            path = _.compact(path);
            for (var i = 1; i < path.length; i++) {
                pairs.push([path[i - 1], path[i]]);
            }
            pairs.forEach(function(p) {
                paths.push(pathPart.replace(/<FROM>/g, p[0])
                    .replace(/<TO>/g, p[1])
                    .replace(/<LEVEL>/g, level));
                level += 1;
            });
            var qry = queryPath.replace('<PATH>', paths.join(' UNION '));
            return qry;
        }

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, personMapperService);

        function getResultsAge(facetSelections) {
            var q = queryAge.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return endpoint.getObjectsNoGrouping(q).then( function(res) {
                return _.map(res, function(obj) {
                    return { c: [{ v: parseInt(obj.age)}, { v: parseInt(obj.casualties) }] };
                });
            });
        }

        function getResultsBarChart(facetSelections, predicate) {
            var q = queryBarChart.replace(/<PREDICATE>/g, predicate).replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return endpoint.getObjectsNoGrouping(q).then(function(res) {
                var ids = _.compact(_.uniq(_.map(res, 'var')));
                return baseRepository.getLabel(ids).then(function(labels) {
                    var labelDict = _.keyBy(labels, 'id');
                    res.forEach(function(r) {
                        var lbl = labelDict[r.var];
                        r.var = lbl ? lbl.getLabel() : r.var;
                    });
                    return res;
                });
            }).then(function(res) {
                return _.map(res, function(obj) {
                    return { c: [{ v: obj.var }, { v: parseInt(obj.casualties) }] };
                });
            });
        }

        function mapResults(original, labels, predicates) {
            var labelDict = _.keyBy(labels, 'id');
            return _.map(original, function(row) {
                var res = {};
                ['from', 'to'].forEach(function(attr) {
                    var level = parseInt(row.level) + (attr === 'to' ? 1 : 0);

                    res[attr] = predicates[level] + ': ';

                    if (row[attr]) {
                        var label = labelDict[row[attr]];
                        res[attr] += label ? label.getLabel() : row[attr];
                    } else {
                        res[attr] += '?';
                    }
                });
                return {
                    c: [
                        { v: res.from },
                        { v: res.to },
                        { v: parseInt(row.count) }
                    ]
                };
            });
        }

        function getResultsPath(facetSelections, path) {
            var q = getPathQuery(_.map(path, 'predicate')).replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return endpoint.getObjectsNoGrouping(q).then(function(res) {
                var ids = _.compact(_.uniq(_.flatMap(res, function(obj) {
                    return [obj.from, obj.to];
                })));
                return baseRepository.getLabel(ids).then(function(labels) {
                    var results =  mapResults(res, labels, _.map(path, 'name'));
                    return results;
                });
            });
        }
    }
})();
