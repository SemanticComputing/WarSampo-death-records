(function() {
    'use strict';

    angular.module('facetApp')

    .directive('wsFooter', wsFooterDirective);

    /* @ngInject */
    function wsFooterDirective($templateRequest, $compile) {
        return {
            link: link
        };

        function link(scope, elem) {
            return $templateRequest('/page-templates/footer.html')
            .then(function(template) {
                return $compile(elem.html(template).contents())(scope);
            });
        }
    }
})();
