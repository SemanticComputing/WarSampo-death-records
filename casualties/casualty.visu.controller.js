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
    function VisuController($scope, $location, $q, $state, _, casualtyVisuService,
            FacetHandler, facetUrlStateHandlerService) {

        var vm = this;
   
        vm.ageDistribution = [];
		vm.removeFacetSelections = removeFacetSelections;

		google.charts.load('current', {packages: ['corechart', 'line', 'sankey']});

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        casualtyVisuService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function getFacetOptions() {
            var options = casualtyVisuService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                    vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            return fetchResults(facetSelections).then(function (people) {
            	google.charts.setOnLoadCallback(function () {
            	    drawColumnChart(vm.ageDistribution, 'Ikäjakauma', 'chart_age', 'Vuosi', 'Menehtyneitä', ['#AA2211']);
            	    });
            	return;
	         });
        }
        
		function drawColumnChart(chartData, label, target, xlabel, ylabel, colors) {
			var data = new google.visualization.DataTable(),

				options = {
				    title: label,
				    legend: { position: 'none' },

            		tooltip: {format: 'none'},
				    colors: colors,

				    hAxis: {
				    	slantedText:false,
				    	maxAlternation: 1,
				    	format: ''
				    	},
				    vAxis: {
				    	 maxValue: 4
				    },
			    	width: '95%',
			    	bar: {
			    	      groupWidth: '88%'
			    	    },
			    	height:500
				  },

				chart = new google.visualization.ColumnChart(document.getElementById(target));

	        data.addColumn('number', xlabel);
	        data.addColumn('number', ylabel);

			data.addRows(chartData);
			chart.draw(data, options);
		}


        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.people = [];
            vm.ages = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return casualtyVisuService.getResults(facetSelections).then(function(res) {
            	if (latestUpdate !== updateId) {
                    return;
                }

                vm.isLoadingResults = false;
    			vm.ageDistribution = $.map( res[0], function( obj ) {
    			    return [[ parseInt(obj.age), parseInt(obj.casualties) ]];
    			});

                return res;
            }).catch(handleError);
        }

        function handleError(error) {
        	console.log(error)
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
