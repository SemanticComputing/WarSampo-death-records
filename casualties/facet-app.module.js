/*
 * facetApp module definition
 */
(function() {

    'use strict';
    angular.module('facetApp', ['seco.facetedSearch', 'ngTable', 'pascalprecht.translate'])

    .constant('_', _) // eslint-disable-line no-undef
    .constant('RESULTS_PER_PAGE', 25)
    .constant('PAGES_PER_QUERY', 1)

    .config(function($translateProvider) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'lang/locale-',
            suffix: '.json'
        });
        $translateProvider.preferredLanguage('fi');
        $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
    });
})();
