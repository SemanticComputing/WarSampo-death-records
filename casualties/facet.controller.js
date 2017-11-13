/*
 * Casualties Facet Controller
 *
 */

(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the facets.
    */
    .controller('FacetController', function ($scope, $timeout, $state, casualtyFacetService,
        FacetHandler, facetUrlStateHandlerService) {

        var vm = this;

        vm.expandedFacets = {};
        vm.expandFacet = expandFacet;
        vm.shrinkFacet = shrinkFacet;

        vm.removeFacetSelections = removeFacetSelections;

        init();

        function init() {
            return casualtyFacetService.getFacets().then(function(facets) {
                vm.facets = facets;
                return getFacetOptions($scope);
            }).then(function(options) {
                vm.facetOptions = options;
                vm.handler = new FacetHandler(vm.facetOptions);
            });
        }

        function getFacetOptions(scope) {
            return casualtyFacetService.getFacetOptions().then(function(options) {
                options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
                options.scope = scope;
                return options;
            });
        }

        function removeFacetSelections() {
            $state.reload();
        }

        function expandFacet(facet) {
            vm.expandedFacets[facet] = vm.expandedFacets[facet] || {};
            if (vm.expandedFacets[facet].promise) {
                $timeout.cancel(vm.expandedFacets[facet].promise);
            }
            vm.expandedFacets[facet].isExpanded = true;
        }

        function shrinkFacet(facet) {
            vm.expandedFacets[facet] = vm.expandedFacets[facet] || {};
            var promise = $timeout(function() {
                vm.expandedFacets[facet].isExpanded = false;
            }, 400);
            vm.expandedFacets[facet].promise = promise;
            return promise;
        }

    });
})();
