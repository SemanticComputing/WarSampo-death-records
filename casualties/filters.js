(function() {
    'use strict';

    angular.module('facetApp')
    /* @ngInject */
    .filter('castArray', function(_) {
        return function(input) {
            return _.castArray(input);
        };
    })
    .filter('localId', function() {
        return function(input) {
            return input.replace(new RegExp('^.*/(.*?)$'), '$1');
        };
    });
})();
