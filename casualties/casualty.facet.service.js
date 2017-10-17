(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
     * Casualty common properties service
     */
    .service('casualtyFacetService', casualtyFacetService);

    /* @ngInject */
    function casualtyFacetService($translate, _, ENDPOINT_CONFIG) {

        this.getFacets = getFacets;
        this.getFacetOptions = getFacetOptions;

        var facets = {
            // Text search facet for name
            name: {
                facetId: 'name',
                predicate: '<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'NAME',
                graph: '<http://ldf.fi/warsa/casualties>',
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
                services: ['<https://ldf.fi/pnr/sparql>'],
                enabled: true
            },
            principalAbode: {
                facetId: 'principalAbode',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/asuinkunta>',
                name: 'PRINCIPAL_ABODE',
                services: ['<https://ldf.fi/pnr/sparql>']
            },
            deathMunicipality: {
                facetId: 'deathMunicipality',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinkunta>',
                name: 'DEATH_MUNICIPALITY',
                services: ['<https://ldf.fi/pnr/sparql>']
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
            perishingClass: {
                facetId: 'perishingClass',
                predicate: '<http://ldf.fi/schema/narc-menehtyneet1939-45/menehtymisluokka>',
                name: 'PERISHING_CLASS'
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
                hierarchy: '<http://purl.org/dc/terms/isPartOf>',
                depth: 3
            }
        };

        var facetOptions = {
            endpointUrl: ENDPOINT_CONFIG.endpointUrl,
            rdfClass: '<http://ldf.fi/schema/narc-menehtyneet1939-45/DeathRecord>',
            // Include the label (name) as a constraint so that we can use it for sorting.
            // Have to use ?id here as the subject variable.
            constraint: '?id skos:prefLabel ?name .'
        };

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
            return $translate('NO_SELECTION').then(function(noSelection) {
                var prefLang = $translate.use();
                var facetOptionsCopy = angular.copy(facetOptions);
                facetOptionsCopy.preferredLang = [prefLang, prefLang === 'en' ? 'fi' : 'en', 'sv'];
                facetOptionsCopy.noSelectionString = noSelection;
                return facetOptionsCopy;
            });
        }
    }
})();
