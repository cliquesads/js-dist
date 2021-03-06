/* jshint node: true */
'use strict';

module.exports = function(grunt) {

	// Project Configuration
	grunt.initConfig({
		uglify: {
			production: {
				options: {
					mangle: false,
                    output: {
					    comments: 'some'
                    }
				},
				files: {
					'dist/cloader.min.js': 'dist/cloader.js'
				}
			},
            dev: {
                options: {
                    mangle: false,
                    output: {
                        comments: 'some'
                    }
                },
                files: {
                    'dist/cloader-dev.min.js': 'dist/cloader-dev.js'
                }
            },
            "local-test": {
                options: {
                    mangle: false,
                    output: {
                        comments: 'some'
                    }
                },
                files: {
                    'dist/cloader-local-test.min.js': 'dist/cloader-local-test.js'
                }
            }
		},
		env: {
            // Only added development environment to add dev env step to build task as a hack
            dev: {
                NODE_ENV: 'dev'
            },
            production: {
                NODE_ENV: 'production'
            },
			"local-test": {
				NODE_ENV: 'local-test'
			}
		}
	});

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	// A Task for loading the configuration object
	grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function(){
		var config = require('config'),
            pubPath = require('@cliques/cliques-node-utils').urls.PUB_PATH,
            exchangeHostname = config.get('Exchange.http.external.hostname'),
            exchangeSecureHostname = config.get('Exchange.https.external.hostname'),
            port = config.get('Exchange.http.external.port'),
            securePort = config.get('Exchange.https.external.port');
        if (port){
            exchangeHostname += ':' + port;
        }
        if (securePort){
            exchangeSecureHostname += ':' + securePort;
        }
        grunt.log.ok('NODE_ENV set to ' + process.env.NODE_ENV);

		grunt.config.set('exchangeHostname', exchangeHostname);
        grunt.config.set('exchangeSecureHostname', exchangeSecureHostname);
		grunt.config.set('pubPath', pubPath);

		// Now load client custom factory & params & set grunt configs
        var custom;
        try {
            custom = config.get('Static.Custom');
        } catch (e){
            grunt.log.ok('No custom factories provided, skipping.');
        }

		if (custom){
            grunt.config.set('custom', custom);
        }

        grunt.log.ok(process.env.NODE_ENV + ' environment config loaded.')
	});

    // Task to build cloader.js file
    grunt.task.registerTask('buildLoader', 'Passes config values to cliquesAdsAsync & builds ClientLoader.js', function(){

        // first build any custom factories, if provided
        var custom, factory;
        try {
            custom = grunt.config.get('custom');
        } catch (e){}

        if (custom){
            var getFactory = require(custom.factoryFile);
            factory = getFactory(custom.options);
        }

        var getClientLoader = require('./getClientLoader');
        var fs = require('fs');

        var exchangeHostname = grunt.config.get('exchangeHostname'),
            exchangeSecureHostname = grunt.config.get('exchangeSecureHostname'),
            pubPath = grunt.config.get('pubPath');

        grunt.log.ok('Building cloader.js...');

        // load serialized function closure to write to file
        var fString = getClientLoader(exchangeHostname, exchangeSecureHostname, pubPath, factory);

        // Add environment suffix in all env's except for prod
        var suffix = process.env.NODE_ENV === 'production' ? '' : '-' + process.env.NODE_ENV;

        var fName = './dist/cloader' + suffix + '.js';
        fs.writeFileSync(fName, fString, 'utf8');
        grunt.log.ok(fName + ' has been created.');
    });

    //main multi tasks
	grunt.registerTask('default', ['env:local-test','loadConfig', 'buildLoader', 'uglify:local-test']);
    grunt.registerTask('build_production', ['env:production','loadConfig', 'buildLoader', 'uglify:production']);
    grunt.registerTask('build_dev', ['env:dev','loadConfig', 'buildLoader', 'uglify:dev']);
};