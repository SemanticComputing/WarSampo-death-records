(function() {
    'use strict';

    /*
    * Service for transforming SPARQL result triples into more manageable objects.
    *
    * Author Erkki Heino.
    */
    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .constant('_', _) // eslint-disable-line no-undef

    .service('personMapperService', personMapperService);

    /* ngInject */
    function personMapperService(_, objectMapperService) {
        // Only the makeObject function is overriden, other objectMapperService
        // functions are used as is.
        PersonMapper.prototype.makeObject = makeObject;

        var proto = Object.getPrototypeOf(objectMapperService);
        PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);

        return new PersonMapper();

        function PersonMapper() {
            this.objectClass = Object;
        }

        // Form an object from a single result row.
        function makeObject(obj) {
            var o = new this.objectClass();

            // Simply form the object using the result variables
            // (This is what objectMapperService does by default.)
            _.forOwn(obj, function(value, prop) {
                o[prop] = value.value;
            });

            // If the casualty is linked to a military unit, form an object list for it.
            // (A list because then we can always assume that if there is a value for unit,
            // it will be a list.)
            // Possible additional units will be appended to the list when result objects are merged.
            if (o.unit) {
                o.unit = [{
                    id: o.unit_uri,
                    label: o.unit
                }];
            }

            // Same for municipality of death (except we expect a single municipality,
            // so no list - in case there are multiple for some reason, a list will be
            // formed automatically when result objects are merged).
            if (o.death_municipality) {
                o.death_municipality = {
                    id: o.death_municipality_uri,
                    label: o.death_municipality
                };
            }

            return o;
        }
    }
})();
