/*
 * facetApp module definition
 */
(function() {

    'use strict';

    angular.module('facetApp', ['ui.router', 'seco.facetedSearch', 'ngTable', 'pascalprecht.translate'])

    .constant('_', _) // eslint-disable-line no-undef
    .constant('RESULTS_PER_PAGE', 25)
    .constant('PAGES_PER_QUERY', 1)
    .constant('defaultLocale', 'fi')
    .constant('supportedLocales', ['fi', 'en'])

    .config(function($urlMatcherFactoryProvider) {
        $urlMatcherFactoryProvider.strictMode(false);
    })

    .config(function($stateProvider) {
        $stateProvider
        .state('facetApp', {
            abstract: true,
            url: '/{lang}',
            templateUrl: 'views/main.html',
            resolve: {
                checkLang: checkLang
            }
        })
        .state('facetApp.casualties', {
            url: '/casualties',
            templateUrl: 'views/casualties.html',
            controller: 'MainController',
            controllerAs: 'vm'
        });
    })

    .config(function($urlRouterProvider, defaultLocale) {
        $urlRouterProvider.otherwise('/' + defaultLocale + '/casualties');
    })

    .config(function($locationProvider) {
        $locationProvider.html5Mode(true);
    })

    .config(function($translateProvider, defaultLocale) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'casualties/lang/locale-',
            suffix: '.json'
        });
        $translateProvider.preferredLanguage(defaultLocale);
        $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
    });

    /* @ngInject */
    function checkLang($state, $stateParams, $q, $translate, _, supportedLocales) {
        var lang = $stateParams.lang;
        if (lang && _.includes(supportedLocales, lang)) {
            return $translate.use(lang);
        }
        return $q.when();
    }
})();
