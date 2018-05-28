(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
     * Casualty service
     */
    .service('casualtyResultsService', casualtyResultsService);

    /* @ngInject */
    function casualtyResultsService($translate, _, FacetResultHandler, personMapperService,
            casualtyFacetService, PREFIXES, ENDPOINT_CONFIG) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = casualtyFacetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = casualtyFacetService.getFacetOptions;

        /* Implementation */

        var properties = [
            '?name',
            '?occupation__id',
            '?occupation__label',
//            '?marital_status',
            '?birth_municipality__id',
            '?birth_municipality__label',
            '?death_municipality__id',
            '?death_municipality__label',
            '?death_place',
            '?tob',
            '?tod',
            '?age',
            '?rank__id',
            '?rank__label',
            '?unit__id',
            '?unit__label',
            '?unit_str',
            '?casualty_class',
            '?children',
            '?language',
            '?gender',
            '?nationality',
            '?cemetery__id',
            '?cemetery__label',
            '?warsa_person'
        ];

        // The query for the results.
        // ?id is bound to the casualty URI.
        var query =
        ' SELECT ?id <PROPERTIES> WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '  OPTIONAL { ?id skos:prefLabel ?name . }' +
        '  OPTIONAL { ?id crm:P70_documents ?warsa_person . }' +
        '  OPTIONAL { ' +
        '   ?id wcsc:perishing_category ?perishing_category_uri .' +
        '   ?perishing_category_uri skos:prefLabel ?casualty_class . ' +
        '  }' +
        '  OPTIONAL { ' +
        '   ?id wcsc:municipality_of_death ?death_municipality__id .' +
        '   OPTIONAL {' +
        '    ?death_municipality__id skos:prefLabel ?death_municipality__label .' +
        '   }' +
        '  }' +
        '  OPTIONAL { ' +
        '   ?id wcsc:municipality_of_birth ?birth_municipality__id .' +
        '   OPTIONAL {' +
        '    ?birth_municipality__id skos:prefLabel ?birth_municipality__label .' +
        '   }' +
        '  }' +
        '  OPTIONAL { ?id wsch:date_of_birth ?tob . }' +
        '  OPTIONAL { ?id wsch:date_of_death ?tod . }' +
        '  BIND( year(?tod) - year(?tob) - if(month(?tod) < month(?tob) || ' +
        '   (month(?tod) = month(?tob) && day(?tod) < day(?tob)), 1, 0) as ?age )' +
        '  OPTIONAL { ?id bioc:has_occupation ?occupation__id . ?occupation__id skos:prefLabel ?occupation__label }' +
        '  OPTIONAL { ?id wsch:number_of_children ?children . }' +
        '  OPTIONAL { ' +
        '   ?id wsch:mother_tongue ?language_uri .' +
        '   ?language_uri skos:prefLabel ?language . ' +
        '  }' +
        '  OPTIONAL { ?id wsch:gender ?gender_uri . ?gender_uri skos:prefLabel ?gender . }' +
        '  OPTIONAL { ?id wcsc:municipality_of_death ?death_place . }' +
        '  OPTIONAL { ?id wsch:nationality ?nationality_uri . ?nationality_uri skos:prefLabel ?nationality . }' +
        '  OPTIONAL { ?id wsch:buried_in ?cemetery__id . ?cemetery__id skos:prefLabel ?cemetery__label . }' +
        '  OPTIONAL { ' +
        '   ?id wcsc:rank ?rank__id .' +
        '   ?rank__id skos:prefLabel ?rank__label  .' +
        '  }' +
        '  OPTIONAL { ?id wcsc:unit ?unit__id . ?unit__id skos:prefLabel ?unit__label . }' +
        '  OPTIONAL { ?id wcsc:rank_literal ?unit_str . }' +
        ' }';

        query = query.replace(/<PROPERTIES>/g, properties.join(' '));

        var resultOptions = {
            queryTemplate: query,
            prefixes: PREFIXES,
            mapper: personMapperService, // use a custom object mapper
            pagesPerQuery: 2 // get two pages of results per query
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(ENDPOINT_CONFIG, resultOptions);

        function getResults(facetSelections) {
            // Get the results sorted by ?name.
            // Any variable declared in facetOptions.constraint can be used in the sorting,
            // and any valid SPARQL ORDER BY sequence can be given.
            // The results are sorted by URI by default.
            return resultHandler.getResults(facetSelections, 'DESC(?score) ?name');
        }
    }
})();
