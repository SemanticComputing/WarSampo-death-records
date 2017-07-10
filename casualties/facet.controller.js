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
    .controller('FacetController', function ($scope, $state, casualtyFacetService,
        FacetHandler, facetUrlStateHandlerService) {

        var vm = this;

        vm.removeFacetSelections = removeFacetSelections;

        casualtyFacetService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function getFacetOptions() {
            var options = casualtyFacetService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }

        function removeFacetSelections() {
            $state.reload();
        }

    });
})();
