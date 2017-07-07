(function() {
    'use strict';

    /*
    * Service for transforming SPARQL result triples into more manageable objects.
    *
    * Author Erkki Heino.
    */
    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('personMapperService', personMapperService)
    .factory('Person', Person);

    /* ngInject */
    function personMapperService(_, translateableObjectMapperService, Person) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);
        PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);

        return new PersonMapper();

        function PersonMapper() {
            this.objectClass = Person;
        }
    }

    /* ngInject */
    function Person(TranslateableObject) {
        Person.prototype = TranslateableObject.prototype;

        return Person;

        function Person() { }
    }
})();
