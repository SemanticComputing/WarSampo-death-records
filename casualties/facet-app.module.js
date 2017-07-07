/*
 * facetApp module definition
 */
(function() {

    'use strict';

    angular.module('facetApp', [
        'ui.router',
        'seco.facetedSearch',
        'seco.translateableObjectMapper',
        'ngTable',
        'pascalprecht.translate'
    ])

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
    })

    .run(function($state, $transitions, $location) {
        $transitions.onError({}, function(transition) {
            // Temporary workaround for transition.error() not returning
            // the error (https://github.com/angular-ui/ui-router/issues/2866)
            return transition.promise.catch(function($error$) {
                if ($error$ && $error$.redirectTo) {
                    // Redirect to the given URL (the previous URL was missing
                    // the language code.
                    $location.url($error$.redirectTo);
                }
            });
        });
    });

    /* @ngInject */
    function checkLang($location, $stateParams, $q, $translate, _, supportedLocales, defaultLocale) {
        var lang = $stateParams.lang;
        if (lang && _.includes(supportedLocales, lang)) {
            return $translate.use(lang);
        }
        if (lang === 'casualties') {
            // No language code in URL, reject the transition with a fixed URL.
            var url = '/' + defaultLocale + $location.url();
            return $q.reject({ redirectTo: url });
        }

        return $q.reject();
    }
})();
