(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('facetApp')
    .service('placeRepository', placeRepository);

    function placeRepository(_, baseRepository ) {

        var self = this;

        /* Public API */

        // Paging is not supported
        // TODO: Use a union query to support paging

        self.getById = getById;
        self.getNearbyPlaceIds = getNearbyPlaceIds;

        /* Implementation */

        var select =
            ' SELECT DISTINCT ?id ?label ?municipality_id ?municipality__id ' +
            ' ?municipality__label ?point__lat ?point__lon ?type_id ?type ';

        var warsaPlaceQry = select +
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

        var pnrPlaceQry = select +
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
            return baseRepository.baseGet({ warsa: warsaPlaceQry, pnr: pnrPlaceQry }, id);
        }

        function getNearbyPlaceIds(id) {
            return baseRepository.baseGet({ warsa: warsaNearByPlaceQry, pnr: pnrNearByPlaceQry }, id).then(function(places) {
                return _.map(places, 'id');
            });
        }
    }
})();
