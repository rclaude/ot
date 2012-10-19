var http 		= require('http'),
    fs	 		= require('fs'),
    TextOperation	= require('./server/text-operation'),
    WrappedOperation	= require('./server/wrapped-operation'),
    OTServer		= require('./server/server'),
    WebSocket		= require('ws');

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

var s = new WebSocket.Server({port: +process.argv[2] || 1234});
s.on('connection', function(socket) {
  socket.on('message', function(message) {
    console.log('received: %s', message);
  });
  socket.send('something');
});
