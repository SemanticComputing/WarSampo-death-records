/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the results view.
    */
    .controller('VisuController', VisuController);

    /* @ngInject */
    function VisuController($scope, $location, $q, $state, $stateParams, $translate, _,
            casualtyVisuService, FacetHandler, facetUrlStateHandlerService,
            EVENT_REQUEST_CONSTRAINTS) {

        var vm = this;
        vm.errorHandler = chartErrorHandler;

        vm.visualizationType = $stateParams.type;

        if (vm.visualizationType == 'age') {
            vm.chart = {
                type: 'ColumnChart',
                data: {
                    rows: [],
                    cols: [
                        { id: 'x', label: '', type: 'number' },
                        { id: 'y', label: '', type: 'number' }
                    ]
                },
                options: {
                    title: '',
                    hAxis: {
                        title: '',
                        ticks: [ 0, 15, 30, 45, 60, 75 ]
                    },
                    vAxis: { title: '' },
                }
            };

            $translate(['AGE', 'NUM_CASUALTIES', 'AGE_DISTRIBUTION'])
            .then(function(translations) {
                vm.chart.data.cols[0].label = translations['AGE'];
                vm.chart.data.cols[1].label = translations['NUM_CASUALTIES'];
                vm.chart.options.title = translations['AGE_DISTRIBUTION'];
                vm.chart.options.hAxis.title = translations['AGE'];
                vm.chart.options.vAxis.title = translations['NUM_CASUALTIES'];
            });
        } else if (vm.visualizationType == 'path') {
            vm.chart = {
                type: 'Sankey',
                data: {
                    rows: [],
                    cols: [
                        { id: 'from', type: 'string' },
                        { id: 'to', type: 'string' },
                        { id: 'weight', type: 'number' }
                    ]
                },
                options: {
                    height: 1000,  // TODO: change this according to the amount of results
                    sankey: {
                        node: { label: { fontName: 'Times-Roman',
                                                 fontSize: 16 } },
                        }
                    }
            };
        } else {
            return;
        }

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);
        $scope.$emit(EVENT_REQUEST_CONSTRAINTS);  // Request facet selections from facet handler

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            return fetchResults(facetSelections);
        }

        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.chart.data.rows = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            var getResults;

            if (vm.visualizationType == 'path') {
                getResults = casualtyVisuService.getResultsPath;
            } else {
                // Default to age visualization
                getResults = casualtyVisuService.getResultsAge;
            }

            return getResults(facetSelections).then(function(res) {
                if (latestUpdate !== updateId) {
                    return;
                }
                console.log(res);

                vm.chart.data.rows = res;
                vm.isLoadingResults = false;
                console.log(vm.chart.data);
                return res;
            }).catch(handleError);
        }

        function chartErrorHandler(message, chart) {
            console.log(message);
            console.log(chart);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
