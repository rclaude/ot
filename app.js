var ot      = require('operational-transformation'),
    ws	  	= require('ws');

var server = new ws.Server({ port: +process.argv[2] || 1234 });

server.on('connection', function(socket) {

  socket.on('message', function(message) {
    console.log('received: %s', message);
  });

  socket.emit('start');
});



