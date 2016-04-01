'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        concat: {
            dist: {
                src: ['src/sparql.module.js',
                        'src/sparql.sparql-service.js',
                        'src/sparql.advanced-sparql-service.js',
                        'src/sparql.object-mapper-service.js',
                        'src/sparql.pager-service.js',
                        'src/sparql.query-builder-service.js'],
                dest: 'dist/sparql-service.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('build', ['concat:dist']);
};
