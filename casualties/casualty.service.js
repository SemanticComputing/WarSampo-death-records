(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
     * Casualty service
     */
    .service( 'casualtyService', casualtyService );

    /* @ngInject */
    function casualtyService( $q, $translate, _, FacetResultHandler, personMapperService ) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;

        /* Implementation */

        var facets = {
            // Text search facet for name
            '<http://www.w3.org/2004/02/skos/core#prefLabel>': {
                name: 'NAME',
                type: 'text',
                enabled: true
            },
            // Time span facet for date of death
            '<http://ldf.fi/kuolinaika>' : {
                name: 'TIME_OF_DEATH',
                type: 'timespan',
                start: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>',
                end: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>',
                min: '1939-10-01',
                max: '1989-12-31'
            },
            // Basic facets with labels in another service
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/synnyinkunta>': {
                name: 'BIRTH_MUNICIPALITY',
                service: '<http://ldf.fi/pnr/sparql>',
                enabled: true
            },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/asuinkunta>': {
                name: 'PRINCIPAL_ABODE',
                service: '<http://ldf.fi/pnr/sparql>'
            },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinkunta>': {
                name: 'DEATH_MUNICIPALITY',
                service: '<http://ldf.fi/pnr/sparql>'
            },
            // Basic facets
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/ammatti>': { name: 'OCCUPATION' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/siviilisaeaety>': { name: 'MARITAL_STATUS' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/lasten_lukumaeaerae>': { name: 'NUM_CHILDREN' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/osasto>': { name: 'UNIT' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/sukupuoli>': { name: 'GENDER' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/kansallisuus>': { name: 'NATIONALITY' },

            // Hierarchical facet
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/sotilasarvo>': {
                name: 'RANK',
                type: 'hierarchy',
                property: '<http://purl.org/dc/terms/isPartOf>*|(<http://rdf.muninn-project.org/ontologies/organization#equalTo>/<http://purl.org/dc/terms/isPartOf>*)',
                classes: [
                    '<http://ldf.fi/warsa/actors/ranks/Upseeri>',
                    '<http://ldf.fi/warsa/actors/ranks/Aliupseeri>',
                    '<http://ldf.fi/warsa/actors/ranks/Miehistoe>',
                    '<http://ldf.fi/warsa/actors/ranks/Jaeaekaeriarvo>'
                ]
            }
        };

        // The SPARQL endpoint URL
        var endpointUrl = 'http://ldf.fi/warsa/sparql';

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://www.cidoc-crm.org/cidoc-crm/E31_Document>',
            // Include the label (name) as a constraint so that we can use it for sorting.
            // Have to use ?s here as the subject variable.
            constraint: '?s skos:prefLabel ?name .',
            preferredLang : 'fi'
        };

        var properties = [
            '?name',
            '?occupation',
            '?marital_status',
            '?kuolinkunta_narc',
            '?death_municipality',
            '?death_municipality_uri',
            '?death_place',
            '?tod',
            '?rank_uri',
            '?rank',
            '?unit_uri',
            '?unit',
            '?unit_str',
            '?casualty_class',
            '?children',
            '?language',
            '?gender',
            '?nationality',
            '?warsa_person'
        ];

        var prefixes =
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

        // The query for the results.
        // ?id is bound to the casualty URI.
        var query =
        ' SELECT ?id <PROPERTIES> WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '  OPTIONAL { ?id skos:prefLabel ?name . }' +
        '  OPTIONAL { ?id crm:P70_documents ?warsa_person . }' +
        '  OPTIONAL {' +
        '   ?id m_schema:siviilisaeaety ?siviilisaeaetyuri .' +
        '   ?siviilisaeaetyuri skos:prefLabel ?marital_status . ' +
        '  }' +
        '  OPTIONAL { ' +
        '   ?id m_schema:menehtymisluokka ?menehtymisluokkauri .' +
        '   ?menehtymisluokkauri skos:prefLabel ?casualty_class . ' +
        '  }' +
        '  OPTIONAL { ' +
        '   ?id m_schema:kuolinkunta ?death_municipality_uri .' +
        '   OPTIONAL {' +
        '    ?death_municipality_uri skos:prefLabel ?death_municipality .' +
        '   }' +
        '   OPTIONAL {' +
        '    SERVICE <http://ldf.fi/pnr/sparql> {' +
        '     ?death_municipality_uri skos:prefLabel ?death_municipality .' +
        '    }' +
        '   }' +
        '  }' +
        '  OPTIONAL { ?id m_schema:kuolinaika ?tod . }' +
        '  OPTIONAL { ?id m_schema:ammatti ?occupation . }' +
        '  OPTIONAL { ?id m_schema:lasten_lukumaeaerae ?children . }' +
        '  OPTIONAL { ' +
        '   ?id m_schema:aeidinkieli ?language_uri .' +
        '   ?language_uri skos:prefLabel ?language . ' +
        '  }' +
        '  OPTIONAL { ?id m_schema:sukupuoli ?gender_uri . ?gender_uri skos:prefLabel ?gender . }' +
        '  OPTIONAL { ?id m_schema:kuolinpaikka ?death_place . }' +
        '  OPTIONAL { ?id m_schema:kansallisuus ?nationality_uri . ?nationality_uri skos:prefLabel ?nationality . }' +
        '  OPTIONAL { ?id m_schema:sotilasarvo ?rank_uri . ?rank_uri skos:prefLabel ?rank  . }' +
        '  OPTIONAL { ?id m_schema:osasto ?unit_uri . ?unit_uri skos:prefLabel ?unit . }' +
        '  OPTIONAL { ?id m_schema:joukko_osasto ?unit_str . }' +
        ' }';

        query = query.replace(/<PROPERTIES>/g, properties.join(' '));

        var resultOptions = {
            queryTemplate: query,
            prefixes: prefixes,
            mapper: personMapperService, // use a custom object mapper
            pagesPerQuery: 2 // get two pages of results per query
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(endpointUrl, facets, facetOptions,
                resultOptions);

        function getResults(facetSelections) {
            // Get the results sorted by ?name.
            // Any variable declared in facetOptions.constraint can be used in the sorting,
            // and any valid SPARQL ORDER BY sequence can be given.
            // The results are sorted by URI by default.
            return resultHandler.getResults(facetSelections, '?name');
        }

        function getFacets() {
            // Translate the facet headers.
            return $translate(['NAME', 'TIME_OF_DEATH', 'OCCUPATION', 'BIRTH_MUNICIPALITY',
                    'PRINCIPAL_ABODE', 'DEATH_MUNICIPALITY', 'NATIONALITY', 'NUM_CHILDREN',
                    'TIME_OF_DEATH', 'UNIT', 'GENDER', 'MARITAL_STATUS', 'RANK'])
            .then(function(translations) {
                var facetsCopy = angular.copy(facets);
                _.forOwn(facetsCopy, function(val) {
                    val.name = translations[val.name];
                });
                return facetsCopy;
            });
        }

        function getFacetOptions() {
            return facetOptions;
        }
    }
})();
