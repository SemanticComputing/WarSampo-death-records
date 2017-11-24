/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
    * Controller for the results view.
    */
    .controller('TableController', function ($scope, _, RESULTS_PER_PAGE,
        casualtyResultsService, NgTableParams, FacetHandler, facetUrlStateHandlerService, EVENT_REQUEST_CONSTRAINTS) {

        var vm = this;

        vm.hasError = false;
        vm.noResults = false;

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);
        $scope.$emit(EVENT_REQUEST_CONSTRAINTS);  // Request facet selections from facet handler

        function initializeTable() {
            vm.tableParams = new NgTableParams(
                {
                    count: RESULTS_PER_PAGE
                },
                {
                    getData: getData
                }
            );
        }

        function getData($defer, params) {
            vm.isLoadingResults = true;
            vm.hasError = false;
            vm.noResults = false;

            vm.pager.getPage(params.page() - 1, params.count()).then(function(page) {
                vm.pager.getTotalCount().then(function(count) {
                    if (count < 1) {
                        vm.noResults = true;
                    }
                    vm.tableParams.total(count);
                    $defer.resolve(page);
                    vm.isLoadingResults = false;
                    vm.hasError = false;
                });
            }).catch(function() {
                vm.hasError = true;
                vm.isLoadingResults = false;
            });
        }

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint, vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);

            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            vm.isLoadingResults = true;

            casualtyResultsService.getResults(facetSelections).then(function(pager) {
                vm.pager = pager;
                if (vm.tableParams) {
                    vm.tableParams.page(1);
                    vm.tableParams.reload();
                } else {
                    initializeTable();
                }
            });
        }
    });
})();
