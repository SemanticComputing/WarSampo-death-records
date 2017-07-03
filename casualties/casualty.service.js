(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
     * Casualty service
     */
    .service('casualtyService', casualtyService);

    /* @ngInject */
    function casualtyService($translate, _, FacetResultHandler, personMapperService) {

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
            name: {
                facetId: 'name',
                predicate: '<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'NAME',
                enabled: true
            },
            // Time span facet for date of death
            timeOfDeath: {
                facetId: 'timeOfDeath',
                predicate: '<http://ldf.fi/kuolinaika>',
                name: 'TIME_OF_DEATH',
                startPredicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>',
                endPredicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>',
                min: '1939-10-01',
                max: '1989-12-31',
                enabled: true
            },
            // Basic facets with labels in another service
            birthMunicipality: {
                facetId: 'birthMunicipality',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/synnyinkunta>',
                name: 'BIRTH_MUNICIPALITY',
                services: ['<http://ldf.fi/pnr/sparql>'],
                enabled: true
            },
            principalAbode: {
                facetId: 'principalAbode',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/asuinkunta>',
                name: 'PRINCIPAL_ABODE',
                services: ['<http://ldf.fi/pnr/sparql>']
            },
            deathMunicipality: {
                facetId: 'deathMunicipality',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinkunta>',
                name: 'DEATH_MUNICIPALITY',
                services: ['<http://ldf.fi/pnr/sparql>']
            },
            // Basic facets
            occupation: {
                facetId: 'occupation',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/ammatti>',
                name: 'OCCUPATION'
            },
            maritalStatus: {
                facetId: 'maritalStatus',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/siviilisaeaety>',
                name: 'MARITAL_STATUS'
            },
            numChildren: {
                facetId: 'numChildren',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/lasten_lukumaeaerae>',
                name: 'NUM_CHILDREN'
            },
            unit: {
                facetId: 'unit',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/osasto>',
                name: 'UNIT'
            },
            gender: {
                facetId: 'gender',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/sukupuoli>',
                name: 'GENDER'
            },
            nationality: {
                facetId: 'nationality',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kansallisuus>',
                name: 'NATIONALITY'
            },
            cemetery: {
                facetId: 'cemetery',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/hautausmaa>',
                name: 'CEMETERY'
            },

            // Hierarchical facet
            rank: {
                facetId: 'rank',
                name: 'RANK',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/sotilasarvo>',
                hierarchy: '<http://purl.org/dc/terms/isPartOf>*|(<http://rdf.muninn-project.org/ontologies/organization#equalTo>/<http://purl.org/dc/terms/isPartOf>*)',
                classes: [
                    '<http://ldf.fi/warsa/actors/ranks/Upseeri>',
                    '<http://ldf.fi/warsa/actors/ranks/Aliupseeri>',
                    '<http://ldf.fi/warsa/actors/ranks/Miehistoe>',
                    '<http://ldf.fi/warsa/actors/ranks/Jaeaekaeriarvo>',
                    '<http://ldf.fi/warsa/actors/ranks/Virkahenkiloestoe>',
                    '<http://ldf.fi/warsa/actors/ranks/Lottahenkiloestoe>',
                    '<http://ldf.fi/warsa/actors/ranks/Muu>'
                ]
            }
        };

        var properties = [
            '?name',
            '?occupation',
            '?marital_status',
            '?kuolinkunta_narc',
            '?death_municipality',
            '?death_municipality_uri',
            '?death_place',
            '?tob',
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
            '?cemetery',
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
        '  OPTIONAL { ?id m_schema:syntymaeaika ?tob . }' +
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
        '  OPTIONAL { ?id m_schema:hautausmaa ?cemetery_uri . ?cemetery_uri skos:prefLabel ?cemetery . }' +
        '  OPTIONAL { ' +
        '   ?id m_schema:sotilasarvo ?rank_uri .' +
        '   ?rank_uri skos:prefLabel ?rank  .' +
        '   FILTER(LANG(?rank) = "fi"). ' +
        '  }' +
        '  OPTIONAL { ?id m_schema:osasto ?unit_uri . ?unit_uri skos:prefLabel ?unit . }' +
        '  OPTIONAL { ?id m_schema:joukko_osasto ?unit_str . }' +
        ' }';

        query = query.replace(/<PROPERTIES>/g, properties.join(' '));

        // The SPARQL endpoint URL
        var endpointUrl = 'http://ldf.fi/warsa/sparql';

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://ldf.fi/schema/narc-menehtyneet1939-45/DeathRecord>',
            // Include the label (name) as a constraint so that we can use it for sorting.
            // Have to use ?id here as the subject variable.
            constraint: '?id skos:prefLabel ?name .',
            preferredLang : 'fi'
        };

        var resultOptions = {
            queryTemplate: query,
            prefixes: prefixes,
            mapper: personMapperService, // use a custom object mapper
            pagesPerQuery: 2 // get two pages of results per query
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(endpointUrl, resultOptions);

        function getResults(facetSelections) {
            // Get the results sorted by ?name.
            // Any variable declared in facetOptions.constraint can be used in the sorting,
            // and any valid SPARQL ORDER BY sequence can be given.
            // The results are sorted by URI by default.
            return resultHandler.getResults(facetSelections, '?name');
        }

        function getFacets() {
            // Translate the facet headers.
            return $translate(_.map(facets, 'name'))
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
