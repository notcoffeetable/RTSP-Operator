
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'RTSP-Operator', message: "The fancy RTSP Operator"});
};