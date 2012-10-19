var http 		= require('http'),
    fs	 		= require('fs'),
    textOperation	= require('./server/text-operation'),
    wrappedOperation	= require('./server/wrapped-operation'),
    server		= require('./server/server'); 

http.Server(function(req, res){
  var url = req.url;
  console.log(url);

  fs.readFile('./client'+url, function (err, data) {
    if (err) {
      res.statusCode = 404;
      res.end('casse toi');
      return;
    }
    res.end(data);
  });

}).listen(8080,'127.1');
