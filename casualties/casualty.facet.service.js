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
                startPredicate: '<http://ldf.fi/schema/warsa/date_of_death>',
                endPredicate: '<http://ldf.fi/schema/warsa/date_of_death>',
                min: '1939-10-01',
                max: '1989-12-31',
                enabled: true
            },
            // Basic facets with labels in another service
            birthMunicipality: {
                facetId: 'birthMunicipality',
                predicate: '<http://ldf.fi/schema/warsa/casualties/municipality_of_birth>',
                name: 'BIRTH_MUNICIPALITY',
                enabled: true
            },
            principalAbode: {
                facetId: 'principalAbode',
                predicate: '<http://ldf.fi/schema/warsa/casualties/municipality_of_domicile>',
                name: 'PRINCIPAL_ABODE',
            },
            deathMunicipality: {
                facetId: 'deathMunicipality',
                predicate: '<http://ldf.fi/schema/warsa/casualties/municipality_of_death>',
                name: 'DEATH_MUNICIPALITY',
            },
            // Basic facets
            occupation: {
                facetId: 'occupation',
                predicate: '<http://ldf.fi/schema/bioc/has_occupation>',
                name: 'OCCUPATION'
            },
            maritalStatus: {
                facetId: 'maritalStatus',
                predicate: '<http://ldf.fi/schema/warsa/marital_status>',
                name: 'MARITAL_STATUS'
            },
            numChildren: {
                facetId: 'numChildren',
                predicate: '<http://ldf.fi/schema/warsa/number_of_children>',
                name: 'NUM_CHILDREN'
            },
            unit: {
                facetId: 'unit',
                predicate: '<http://ldf.fi/schema/warsa/casualties/unit>',
                name: 'UNIT'
            },
            perishingClass: {
                facetId: 'perishingClass',
                predicate: '<http://ldf.fi/schema/warsa/casualties/perishing_category>',
                name: 'PERISHING_CLASS'
            },
            gender: {
                facetId: 'gender',
                predicate: '<http://ldf.fi/schema/warsa/gender>',
                name: 'GENDER'
            },
            nationality: {
                facetId: 'nationality',
                predicate: '<http://ldf.fi/schema/warsa/nationality>',
                name: 'NATIONALITY'
            },
            cemetery: {
                facetId: 'cemetery',
                predicate: '<http://ldf.fi/schema/warsa/buried_in>',
                name: 'CEMETERY',
                enabled: true
            },

            // Hierarchical facet
            rank: {
                facetId: 'rank',
                name: 'RANK',
                predicate: '<http://ldf.fi/schema/warsa/casualties/rank>',
                hierarchy: '<http://purl.org/dc/terms/isPartOf>',
                depth: 3
            }
        };

        var facetOptions = {
            endpointUrl: ENDPOINT_CONFIG.endpointUrl,
            rdfClass: '<http://ldf.fi/schema/warsa/DeathRecord>',
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
