(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('facetApp')
    .service('baseRepository', baseRepository);

    /* @ngInject */
    function baseRepository($q, _, AdvancedSparqlService, translateableObjectMapperService,
            ENDPOINT_CONFIG, PNR_ENDPOINT_CONFIG, PREFIXES) {

        var self = this;

        /* Public API */

        self.getLabel = getLabel;
        self.baseGet = baseGet;

        /* Implementation */

        var warsaEndpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, translateableObjectMapperService);
        var pnrEndpoint = new AdvancedSparqlService(PNR_ENDPOINT_CONFIG, translateableObjectMapperService);

        var select =
        ' SELECT DISTINCT ?id ?label ?type_id ?type ';

        var labelQry = select +
        '{ ' +
        ' VALUES ?id { <ID> } ' +
        ' ?id a ?type_id . ' +
        ' ?id skos:prefLabel ?label . ' +
        ' OPTIONAL { ?type_id skos:prefLabel ?type . } ' +
        '} ';

        function getLabel(id) {
            return baseGet(labelQry, id);
        }

        function uriFy(id) {
            if (_.isArray(id)) {
                var uris = '';
                id.forEach(function(id) {
                    uris += '<' + id.replace(/\s+/g, '_') + '> ';
                });
                return uris;
            } else if (id) {
                return '<' + id + '>';
            }
            return;
        }

        function baseGet(qry, id) {
            if (!id) {
                return $q.when();
            }

            if (_.isString(qry)) {
                qry = { warsa: qry, pnr: qry };
            }

            var warsaId = [];
            var pnrId = [];

            function pushUri(uri) {
                if (isPnrUri(uri)) {
                    pnrId.push(uri);
                } else {
                    warsaId.push(uri);
                }
            }

            function formatQry(qry, ids) {
                return PREFIXES + qry.replace('<ID>', uriFy(ids));
            }

            id = _.castArray(id);
            id.forEach(function(uri) {
                pushUri(uri);
            });

            var queries = [];

            if (warsaId.length) {
                queries.push(warsaEndpoint.getObjects(formatQry(qry.warsa, warsaId)));
            }
            if (pnrId.length) {
                queries.push(pnrEndpoint.getObjects(formatQry(qry.pnr, pnrId)));
            }

            return $q.all(queries).then(function(objects) {
                return _.flatten(objects);
            });
        }

        function isPnrUri(uri) {
            return _.includes(uri, 'ldf.fi/pnr/');
        }
    }
})();
