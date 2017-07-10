(function() {
    'use strict';

    angular.module('facetApp')
    .filter('castArray', function(_) {
        return function(input) {
            return _.castArray(input);
        };
    });
})();
