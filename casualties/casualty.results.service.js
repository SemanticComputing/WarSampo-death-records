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
            casualtyFacetService, PREFIXES, ENDPOINT_URL) {

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
            '?occupation',
            '?marital_status',
            '?kuolinkunta_narc',
            '?death_municipality__label',
            '?death_municipality__id',
            '?death_place',
            '?tob',
            '?tod',
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
        '  OPTIONAL {' +
        '   ?id m_schema:siviilisaeaety ?siviilisaeaetyuri .' +
        '   ?siviilisaeaetyuri skos:prefLabel ?marital_status . ' +
        '  }' +
        '  OPTIONAL { ' +
        '   ?id m_schema:menehtymisluokka ?menehtymisluokkauri .' +
        '   ?menehtymisluokkauri skos:prefLabel ?casualty_class . ' +
        '  }' +
        '  OPTIONAL { ' +
        '   ?id m_schema:kuolinkunta ?death_municipality__id .' +
        '   OPTIONAL {' +
        '    ?death_municipality__id skos:prefLabel ?death_municipality__label .' +
        '   }' +
        '   OPTIONAL {' +
        '    SERVICE <http://ldf.fi/pnr/sparql> {' +
        '     ?death_municipality__id skos:prefLabel ?death_municipality__label .' +
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
        '  OPTIONAL { ?id m_schema:hautausmaa ?cemetery__id . ?cemetery__id skos:prefLabel ?cemetery__label . }' +
        '  OPTIONAL { ' +
        '   ?id m_schema:sotilasarvo ?rank__id .' +
        '   ?rank__id skos:prefLabel ?rank__label  .' +
        '  }' +
        '  OPTIONAL { ?id m_schema:osasto ?unit__id . ?unit__id skos:prefLabel ?unit__label . }' +
        '  OPTIONAL { ?id m_schema:joukko_osasto ?unit_str . }' +
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
        var resultHandler = new FacetResultHandler(ENDPOINT_URL, resultOptions);

        function getResults(facetSelections) {
            // Get the results sorted by ?name.
            // Any variable declared in facetOptions.constraint can be used in the sorting,
            // and any valid SPARQL ORDER BY sequence can be given.
            // The results are sorted by URI by default.
            return resultHandler.getResults(facetSelections, '?name');
        }
    }
})();
