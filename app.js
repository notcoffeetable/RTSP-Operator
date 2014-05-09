
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var redis = require('redis');
var client = redis.createClient();
ConfigurationProvider = require('./configurationprovider-mongodb.js').ConfigurationProvider;
// var forever = require('forever');
// var ffmpeg = require('fluent-ffmpeg');

// Redis error logging
client.on("error", function (err) {
    console.log("Error " + err);
});

var app = express();   
var spawn = require('child_process').spawn;
var processes = [];
var ffmpeg = false;
var configurationProvider = new ConfigurationProvider('localhost', 27017);
var sourceServer = '192.168.1.121';
var rtmpPort = 1935;
var controlPort = 8080;
var sourceApp = 'clean';
var targetApp = 'myapp';

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  var util = require('util'); 
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
// GET source->target
app.get('/reroute', function(req, res) {
    configurationProvider.findAll(function(err, configurations){
        if(configurations.length > 0)
        {
            console.log('configs: ' + util.inspect(configurations[0], false, null));   
            sourceServer= configurations[0].sourceServer;
            rtmpPort    = configurations[0].rtmpPort;
            controlPort = configurations[0].controlPort;
            sourceApp   = configurations[0].sourceApp;
            targetApp   = configurations[0].targetApp;       
        }
        
    });
	// ffmpeg -i rtsp://192.168.1.121:1935/live/Mulberry.sdp -acodec copy -vcodec copy -async 1 -f rtsp rtsp://rtsp:stream@192.168.1.121:1935/live/program.sdp
     var stream = req.query.stream;

    //     processes.push(spawn('ffmpeg', ['-i', sourceServer + sourceStream, '-acodec', 'copy', '-vcodec', 'copy', '-async', '1', '-f', 'rtsp', targetServer + targetStream +'.sdp']));
    //     console.log("Processes length: " + processes.length);
    //     if(processes.length > 1)
    //     {
    //         var oldprocess = processes.shift();
    //         oldprocess.kill();            
    //     }

    var options = {
        host: sourceServer,
        port: controlPort,
        path: '/control/redirect/subscriber?app='+sourceApp+'&addr=127.0.0.1&newname=' + stream
    }

    callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            console.log("HTTP RESPONSE: " + str);
        });
    }

    http.request(options, callback).end();

	res.render('reroute.jade', { title: 'Reroute', source: stream, target: "rtmp://" +sourceServer + ':' + rtmpPort +'/' + targetApp + '/' + 'myapp' });	
});

app.get('/reroute-stop', function(req, res) {
    while(processes.length > 0)
    {
        processes.shift().kill();
    }
	res.render('reroute-stop.jade', {title: "Reroute", action: "stop"})
});

app.get('/register', function(req, res) {
	res.render('new-stream.jade', {title: 'Register Stream'})
})

app.post('/register', function(req, res) {
	client.hset("rtsp-streams", req.param('stream-name'), '', redis.print);
	res.redirect('/registered-streams');
});

app.get('/registered-streams', function(req, res) {
	 client.hkeys("rtsp-streams", function (err, replies) {
	 	console.log(replies);
        res.render('registered-streams.jade', {
            title: 'Registered Streams', 
            server: sourceServer, 
            rtmpPort: rtmpPort, controlPort: controlPort, sourceApp: sourceApp, targetApp: targetApp,
            streams: replies});
    });
});

app.get('/configuration', function(req, res) {
    var reroutesRunning = (processes.length > 0);
    res.render('configuration.jade', {
        title: 'Configuration', 
        sourceServer: sourceServer,
        rtmpPort: rtmpPort,
        controlPort: controlPort,
        sourceApp: sourceApp,
        targetApp: targetApp,
        reroutes: reroutesRunning 
    });

})

app.post('/configuration', function(req, res) {
    sourceServer = req.param('source-server');
    targetServer = req.param('rtmp-port');
    controlPort  = req.param('control-port');
    sourceApp    = req.param('source-app');
    targetApp    = req.param('target-app');
    clearStreams = req.param('clear-streams')
    if (clearStreams)
    {
        client.del("rtsp-streams");
    }
    configurationProvider.save({
        sourceServer: sourceServer,
        rtmpPort: rtmpPort,
        controlPort: controlPort,
        sourceApp: sourceApp,
        targetApp: targetApp
    }, function(error, docs) {
        res.redirect('/configuration');
    });
}); 

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
