(function() {
    'use strict';

    angular.module('facetApp')

    .directive('wsNavbar', wsNavbarDirective);

    /* @ngInject */
    function wsNavbarDirective($state, $stateParams, $templateRequest, $compile, $translate) {
        return {
            link: link,
            controller: NavbarController,
            controllerAs: 'vm'
        };

        function link(scope, elem) {
            return $translate.onReady()
            .then(function() {
                var lang = $translate.use();
                return $templateRequest('/page-templates/navbar-' + lang + '.html');
            }).then(function(template) {
                elem.html(template);
                return $templateRequest('views/subnavbar.html');
            }).then(function(template) {
                angular.element('#subnav').html(template);
                return $compile(elem.contents())(scope);
            });
        }

        function NavbarController() {
            var vm = this;

            vm.changeLocale = changeLocale;

            $translate.onReady().then(function() {
                vm.lang = $translate.use();
            });

            function changeLocale(lang) {
                $translate.use(lang);
                $state.go('.', { lang: lang }, { reload: true });
                vm.lang = lang;
            }
        }
    }
})();
