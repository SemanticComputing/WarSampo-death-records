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
        vm.chart = null;
        vm.errorHandler = chartErrorHandler;

        var visualizationType = $stateParams.type;

        if (visualizationType == 'age') {
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
        }
        if (visualizationType == 'path') {
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
                    sankey: {
                        node: {
                            colors: [ '#a61d4c' ],
                            // nodePadding: 8
                        },
                        // link: { color: { stroke: 'black', strokeWidth: 1 } }
                    },
                }
            };
        }
        
        if (vm.chart == null) {
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

            var getResults = null;
            var mapResults = null;

            if (visualizationType == 'age') {
                getResults = casualtyVisuService.getResultsAge;
                mapResults = _.partialRight(_.map, function(obj) {
                    return { c: [{ v: parseInt(obj.age)}, { v: parseInt(obj.casualties) }] };
                });
            }
            if (visualizationType == 'path') {
                getResults = casualtyVisuService.getResultsPath;
                mapResults = _.partialRight(_.map, function(obj) {
                    return { c: [{ v: obj.birthplace }, { v: obj.cemetery }, { v: parseInt(obj.count) }] };
                });
            }

            if (getResults == null) {
                return;
            }

            return getResults(facetSelections).then(function(res) {
                if (latestUpdate !== updateId) {
                    return;
                }
                console.log(res);

                vm.chart.data.rows = mapResults(res);
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
