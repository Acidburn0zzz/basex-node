/* basex-node test interface using vows large data volumes
 * 
 * @TODO teardown connection
 */

var vows = require('vows')
	,assert = require('assert')
	,basex = require('../index.js');

var session = new basex.Session();

// Create a Test Suite
vows.describe('BaseX stress tests').addBatch({
	'Send a xquery and iterate over the 10000 result items ' : {
		topic : function() {
			// create query instance
			var input = 'for $i in 1 to 10000 return <xml>Text { $i }</xml>';
			var query = session.query(input);

			query.results(this.callback);
		},

		'we get no error' : function(err, reply) {
			assert.equal(err, null);
		}
	},
	'return megabyte result from Query' : {
		topic : function() {
			// create query instance
			var input = '(1 to 100000)!"abcdefghij"';
			var query = session.query(input);

			query.results(this.callback);
		},

		'we get no error' : function(err, reply) {
			assert.equal(err, null);
		}
	},
	'return megabyte execute result ' : {
		topic : function() {
			var input = 'xquery (1 to 100000)!"abcdefghij"';		
			session.execute(input,this.callback);
		},

		'we get no error' : function(err, reply) {
			assert.equal(err, null);
		}
	}
}).export(module); // Run it