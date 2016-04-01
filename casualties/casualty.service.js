(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
     * Casualty service
     */
    .service( 'casualtyService', casualtyService );

    /* @ngInject */
    function casualtyService( $q, $translate, _, SparqlService, FacetResultHandler, personMapperService ) {
        var endpointUrl = 'http://ldf.fi/warsa/sparql';
        var resultHandler;

        var facets = {
            '<http://www.w3.org/2004/02/skos/core#prefLabel>': {
                name: 'NAME',
                type: 'text',
                enabled: true
            },
            '<http://ldf.fi/kuolinaika>' : {
                name: 'TIME_OF_DEATH',
                type: 'timespan',
                start: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>',
                end: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>',
                min: '1939-10-01',
                max: '1989-12-31'
            },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/synnyinkunta>': {
                name: 'BIRTH_MUNICIPALITY',
                enabled: true
            },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/asuinkunta>': { name: 'PRINCIPAL_ABODE' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinkunta>': { name: 'DEATH_MUNICIPALITY', service: '<http://ldf.fi/pnr/sparql>' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/ammatti>': { name: 'OCCUPATION' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/siviilisaeaety>': { name: 'MARITAL_STATUS' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/lasten_lukumaeaerae>': { name: 'NUM_CHILDREN' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>': { name: 'TIME_OF_DEATH' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/osasto>': { name: 'UNIT' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/sukupuoli>': { name: 'GENDER' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/kansallisuus>': { name: 'NATIONALITY' }
        };
        resultHandler = new FacetResultHandler(endpointUrl, facets, personMapperService);

        var properties = {
            '?name': '',
            '?occupation': '<http://ldf.fi/schema/narc-menehtyneet1939-45/ammatti>',
            '?marital_status': '',
            '?kuolinkunta_narc': '',
            '?death_municipality': '',
            '?death_municipality_uri': '',
            '?death_place': '',
            '?tod': '',
            '?rank_uri': '',
            '?rank': '',
            '?unit_uri': '',
            '?unit': '',
            '?unit_str': '',
            '?casualty_class': '',
            '?children': '',
            '?language': '',
            '?gender': '',
            '?nationality': '',
            '?warsa_person': ''
        };

        var facetOptions = {
            endpointUrl: endpointUrl,
            graph : '<http://ldf.fi/narc-menehtyneet1939-45/>',
            rdfClass: '<http://www.cidoc-crm.org/cidoc-crm/E31_Document>',
            preferredLang : 'fi'
        };

        var prefixes = '' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
            ' PREFIX wgs84: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
            ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
            ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
            ' PREFIX owl:  <http://www.w3.org/2002/07/owl#>' +
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
            ' PREFIX georss: <http://www.georss.org/georss/>' +
            ' PREFIX text: <http://jena.apache.org/text#>' +
            ' PREFIX m: <http://ldf.fi/sotasampo/narc/menehtyneet/>' +
            ' PREFIX m_schema: <http://ldf.fi/schema/narc-menehtyneet1939-45/>';

        var resultSet = '' +
            '     SELECT ?s ?id ?name { ' +
            '       GRAPH <http://ldf.fi/narc-menehtyneet1939-45/> {' +
            '         <FACET_SELECTIONS> ' +
            '         ?s a crm:E31_Document .' +
            '         ?s skos:prefLabel ?name .' +
            '         BIND(?s AS ?id) ' +
            '       } ' +
            '     } ORDER BY ?name ' +
            '     <PAGE> ';

        var resultSetQry = prefixes + resultSet;

        var query = prefixes +
            ' SELECT ?id ?s <PROPERTIES> ' +
            ' WHERE {' +
            '   { ' +
            '     <RESULTSET> ' +
            '   } ' +
            ' GRAPH <http://ldf.fi/narc-menehtyneet1939-45/> {' +

            ' OPTIONAL { ?s crm:P70_documents ?warsa_person . }' +

            ' OPTIONAL {' +
            ' ?s m_schema:siviilisaeaety ?siviilisaeaetyuri .' +
            ' ?siviilisaeaetyuri skos:prefLabel ?marital_status . }' +
            ' OPTIONAL { ?s m_schema:menehtymisluokka ?menehtymisluokkauri .' +
            ' ?menehtymisluokkauri skos:prefLabel ?casualty_class . }' +

            ' OPTIONAL { ?s m_schema:kuolinkunta ?death_municipality_uri .' +
            ' OPTIONAL {' +
            ' 	GRAPH <http://ldf.fi/warsa/places/municipalities> {' +
            ' 		?death_municipality_uri skos:prefLabel ?warsa_death_municipality .' +
            ' 	}' +
            ' } OPTIONAL {' +
            ' 	?death_municipality_uri skos:prefLabel ?kuolinkunta_narc .' +
            ' }' +
            ' OPTIONAL {' +
            ' 	SERVICE <http://ldf.fi/pnr/sparql> {' +
            ' 	    ?death_municipality_uri skos:prefLabel ?pnr_death_municipality .' +
            ' 	}' +
            ' }' +
            ' }' +

            ' OPTIONAL { ?s m_schema:kuolinaika ?tod . }' +
            ' OPTIONAL { ?s m_schema:ammatti ?occupation . }' +
            ' OPTIONAL { ?s m_schema:lasten_lukumaeaerae ?children . }' +
            ' OPTIONAL { ?s m_schema:aeidinkieli ?language_uri .' +
            '   ?language_uri skos:prefLabel ?language . }' +
            ' OPTIONAL { ?s m_schema:sukupuoli ?gender_uri . ?gender_uri skos:prefLabel ?gender . }' +
            ' OPTIONAL { ?s m_schema:kuolinpaikka ?death_place . }' +
            ' OPTIONAL { ?s m_schema:kansallisuus ?nationality_uri .' +
            '   ?nationality_uri skos:prefLabel ?nationality . }' +
            ' OPTIONAL { ?s m_schema:sotilasarvo ?rank_uri .' +
            '   GRAPH <http://ldf.fi/warsa/actors/ranks> {' +
            '     ?rank_uri skos:prefLabel ?rank  .' +
            '   }' +
            ' }' +
            ' OPTIONAL { ?s m_schema:osasto ?unit_uri .' +
            '   GRAPH <http://ldf.fi/warsa/actors> {' +
            '     ?unit_uri skos:prefLabel ?unit  .' +
            '   }' +
            ' }' +
            ' OPTIONAL { ?s m_schema:joukko_osasto ?unit_str . }' +

            ' }' +
            ' BIND(COALESCE(?warsa_death_municipality, ?kuolinkunta_narc, ?pnr_death_municipality) as ?death_municipality)' +
            ' }';

        query = query.replace(/<RESULTSET>/g, resultSet);
        query = query.replace(/<PROPERTIES>/g, Object.keys( properties ).join(' '));

        this.getResults = getResults;
        this.getFacets = getFacets;
        this.getFacetOptions = getFacetOptions;

        function getResults(facetSelections) {
            return resultHandler.getResults(facetSelections, query, resultSetQry);
        }

        function getFacets() {
            return $translate(['NAME', 'TIME_OF_DEATH', 'OCCUPATION', 'BIRTH_MUNICIPALITY',
                    'PRINCIPAL_ABODE', 'DEATH_MUNICIPALITY', 'NATIONALITY', 'NUM_CHILDREN',
                    'TIME_OF_DEATH', 'UNIT', 'GENDER', 'MARITAL_STATUS'])
            .then(function(translations) {
                _.forOwn(facets, function(val) {
                    val.name = translations[val.name];
                });
                return facets;
            });
        }

        function getFacetOptions() {
            return facetOptions;
        }
    }
})();
