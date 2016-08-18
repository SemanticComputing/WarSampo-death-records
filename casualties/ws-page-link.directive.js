(function() {
    'use strict';

    angular.module('facetApp')

    .directive('wsPageLink', PageLinkDirective);

    /* @ngInject */
    function PageLinkDirective($state, $stateParams, $templateRequest, $compile, $translate) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, elem, attrs) {
            scope.$watch(function () { return attrs.href; }, function(value) {
                if (value) {
                    return setHref(value);
                }
            });

            function setHref(href) {
                return $translate.onReady()
                .then(function() {
                    var lang = $translate.use();
                    elem.attr('href', '/' + lang + (href[0] === '/' ? '' : '/') + href);
                    elem.attr('target', '_self');
                });
            }
        }
    }
})();
