var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

ConfigurationProvider = function(host, port) {
	this.db = new Db('node-rtsp-configuration', new Server(host, port, {auto_reconnect: true}, {}), {safe:false});
	this.db.open(function(){});
};

ConfigurationProvider.prototype.getCollection = function(callback) {
	this.db.collection('configuration', function(error, config_collection) {
		if(error) callback(error)
		else callback(null, config_collection);
	});
};

ConfigurationProvider.prototype.findAll = function(callback) {
	this.getCollection(function(error, config_collection) {
		if(error) callback(error);
		else {
			config_collection.find().toArray(function(error, results) {
				if(error) callback(error)
				else callback(null, results)
				});
		}
	});
}

ConfigurationProvider.prototype.findById = function(id, callback) {
	this.getCollection(function(error, config_collection) {
		if(error) callback(error)
		else {
			config_collection.findOne({_id: config_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
				if(error) callback(error)
		  		else callback(null, result)
		  	});
		}
	});
}

ConfigurationProvider.prototype.save = function(configs, callback) {
	this.getCollection(function(error, config_collection) {
		if(error) callback(error)
		else {
			if(typeof(configs.length) == "undefined")
				configs = [configs];

			for(var i = 0; i < configs.length; i++) {
				config = configs[i];
				config.created_at = new Date();
				config_collection.remove();
				config_collection.insert(configs, function() {
					callback(null, configs);
				});
			}
		}
	});
}

exports.ConfigurationProvider = ConfigurationProvider;