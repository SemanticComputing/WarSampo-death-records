(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('facetApp')
    .service('placeRepository', placeRepository);

    function placeRepository($q, _, AdvancedSparqlService, translateableObjectMapperService,
            QueryBuilderService, ENDPOINT_CONFIG, PNR_ENDPOINT_CONFIG) {

        var self = this;

        /* Public API */

        // Paging is not supported
        // TODO: Use a union query to support paging

        self.getById = getById;
        self.getNearbyPlaceIds = getNearbyPlaceIds;

        /* Implementation */

        var warsaEndpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, translateableObjectMapperService);
        var pnrEndpoint = new AdvancedSparqlService(PNR_ENDPOINT_CONFIG, translateableObjectMapperService);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
        ' PREFIX sch: <http://schema.org/>' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ';

        var select =
            ' SELECT DISTINCT ?id ?label ?municipality_id ?municipality__id ' +
            ' ?municipality__label ?point__lat ?point__lon ?type_id ?type ';

        var warsaPlaceQry =
        '{ ' +
        ' VALUES ?id { <ID> } ' +
        ' ?id a ?type_id . ' +
        ' ?id skos:prefLabel ?label . ' +
        ' OPTIONAL { ?type_id skos:prefLabel ?type . } ' +
        ' OPTIONAL { ?id sch:polygon ?polygon . } ' +
        ' OPTIONAL { ' +
        '   ?id geo:lat ?point__lat ; ' +
        '      geo:long ?point__lon . ' +
        ' } ' +
        ' OPTIONAL { ' +
        '   ?id geosparql:sfWithin ?municipality_id . ' +
        '   ?municipality_id a suo:kunta . ' +
        '   ?municipality_id skos:prefLabel ?municipality__label . ' +
        '   BIND(?municipality_id AS ?municipality__id) ' +
        ' } ' +
        '} ';

        var pnrPlaceQry =
        '{ ' +
        ' VALUES ?id { <ID> } ' +
        ' ?id skos:prefLabel [] . ' +
        ' ?id a ?type_id . ' +
        ' OPTIONAL { ' +
        '   ?id skos:prefLabel ?label . ' +
        '   FILTER(langMatches(lang(?label), "FI")) ' +
        ' } ' +
        ' OPTIONAL { ' +
        '   ?id skos:prefLabel ?label . ' +
        '   FILTER(langMatches(lang(?label), "SV")) ' +
        ' } ' +
        ' OPTIONAL { ' +
        '   ?type_id skos:prefLabel ?type . ' +
        '   FILTER(langMatches(lang(?type), "FI")) ' +
        ' } ' +
        ' OPTIONAL { ' +
        '   ?type_id skos:prefLabel ?type . ' +
        '   FILTER(langMatches(lang(?type), "SV")) ' +
        ' } ' +
        ' OPTIONAL { ' +
        '   ?id geo:lat ?point__lat ; ' +
        '   geo:long ?point__lon . ' +
        ' } ' +
        ' OPTIONAL { ' +
        '   ?id crm:P89_falls_within ?municipality_id . ' +
        '   { ?municipality_id a <http://ldf.fi/pnr-schema#place_type_540> } ' +
        '   UNION ' +
        '   { ?municipality_id a <http://ldf.fi/pnr-schema#place_type_550> } ' +
        '   ?municipality_id skos:prefLabel ?municipality__label . ' +
        '   BIND(?municipality_id AS ?municipality__id) ' +
        ' } ' +
        '} ';

        var warsaNearByPlaceQry =
        '{ ' +
        ' VALUES ?ref_place_id { <ID> } ' +
        ' ?ref_place_id geosparql:sfWithin? [ ' +
        '  a suo:kunta ; ^geosparql:sfWithin? ?id ' +
        ' ] . ' +
        '} ';

        var pnrNearByPlaceQry =
        '{ ' +
        ' VALUES ?ref_place_id { <ID> } ' +
        ' ?ref_place_id crm:P89_falls_within? ?mun_id ' +
        ' { ?mun_id a <http://ldf.fi/pnr-schema#place_type_540> } ' +
        ' UNION ' +
        ' { ?mun_id a <http://ldf.fi/pnr-schema#place_type_550> } ' +
        ' ?mun_id ^crm:P89_falls_within? ?id . ' +
        '} ';

        function getById(id) {
            return baseGet(warsaPlaceQry, pnrPlaceQry, id);
        }

        function getNearbyPlaceIds(id) {
            return baseGet(warsaNearByPlaceQry, pnrNearByPlaceQry, id).then(function(places) {
                return _.map(places, 'id');
            });
        }

        function uriFy(id) {
            if (_.isArray(id)) {
                return '<' + id.join('> <') + '>';
            } else if (id) {
                return '<' + id + '>';
            }
            return;
        }

        function baseGet(warsaQ, pnrQ, id) {
            if (!id) {
                return $q.when();
            }

            var warsaId = [];
            var pnrId = [];

            function pushUri(uri) {
                if (isPnrPlace(uri)) {
                    pnrId.push(uri);
                } else {
                    warsaId.push(uri);
                }
            }

            function formatQry(qry, ids) {
                return prefixes + select + qry.replace('<ID>', uriFy(ids));
            }

            id = _.castArray(id);
            id.forEach(function(uri) {
                pushUri(uri);
            });

            var queries = [];

            if (warsaId.length) {
                queries.push(warsaEndpoint.getObjects(formatQry(warsaQ, warsaId)));
            }
            if (pnrId.length) {
                queries.push(pnrEndpoint.getObjects(formatQry(pnrQ, pnrId)));
            }

            return $q.all(queries).then(function(places) {
                return _.flatten(places);
            });
        }

        function isPnrPlace(uri) {
            return _.includes(uri, 'ldf.fi/pnr/');
        }
    }
})();
