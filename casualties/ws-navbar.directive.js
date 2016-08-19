(function() {
    'use strict';

    angular.module('facetApp')

    .directive('wsNavbar', wsNavbarDirective);

    /* @ngInject */
    function wsNavbarDirective($templateRequest, $compile, $translate, $uibModal) {
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

            vm.showHelp = showHelp;

            $translate.onReady().then(function() {
                vm.lang = $translate.use();
            });

            function showHelp() {
                $uibModal.open({
                    templateUrl: 'views/help.html',
                    size: 'lg'
                });
            }

        }
    }
})();
