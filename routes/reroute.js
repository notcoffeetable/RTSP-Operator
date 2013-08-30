// var ffmpeg = require('fluent-ffmpeg');
/*
* GET reroute
*/
exports.reroute = function(req, res)
{
    var sourceStream = req.query.source,
        targetStream = req.query.target;
	res.render('reroute.jade', { title: 'Reroute', source: sourceStream, target: targetStream });

};