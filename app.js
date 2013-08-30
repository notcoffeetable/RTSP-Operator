
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
// var ffmpeg = require('fluent-ffmpeg');

// Redis error logging
client.on("error", function (err) {
    console.log("Error " + err);
});

var app = express();   
var spawn = require('child_process').spawn;
var ffmpeg = false;

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
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
// GET source->target
app.get('/reroute', function(req, res) {
	// ffmpeg -i rtsp://192.168.0.8:554/live/test.sdp -acodec copy -vcodec copy -async 1 -f rtsp rtsp://192.168.0.8:554/live/dean.sdp
    var sourceStream = req.query.source,
        targetStream = req.query.target;
        // ffmpeg = spawn('ffmpeg', ['-i', 'rtsp://192.168.1.82:554/live/'+ sourceStream +'.sdp', '-acodec', 'copy', '-vcodec', 'copy', '-async', '1', '-f', 'rtsp', 'rtsp rtsp://192.168.1.82:554/live/'+ targetStream +'.sdp']);
ffmpeg = spawn('./live555ProxyServer', ['rtsp://192.168.1.82:554/live/'+ sourceStream +'.sdp']);
    // setTimeout(function() {
    //     ffmpeg.stderr.on('data', function() {
    //         ffmpeg.stdin.setEncoding('utf8');
    //         ffmpeg.stdin.write('q');
    //         process.exit();
    //     });
    // }, 10000);
	res.render('reroute.jade', { title: 'Reroute', source: sourceStream, target: targetStream });	
});

app.get('/reroute-stop', function(req, res) {
	if(ffmpeg != false){

	ffmpeg.kill();
	}
	res.render('reroute-stop.jade', {title: "Reroute", action: "stop"})
});

app.get('/register', function(req, res) {
	res.render('new-stream.jade', {title: 'Register Stream'})
})

app.post('/register', function(req, res) {
// app.post('/contact/new', routes.new);
	client.hset("rtsp-streams", req.param('stream-name'), '', redis.print);
	res.redirect('/registered-streams');
});

app.get('/registered-streams', function(req, res) {
	 client.hkeys("rtsp-streams", function (err, replies) {
	 	console.log(replies);
        res.render('registered-streams.jade', {title: 'Registered Streams', streams: replies});
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
