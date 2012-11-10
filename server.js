var ws = require('ws');

var server = new ws.Server({ port: +process.argv[2] || 1234 });

var sockets = [];
var objects = [];

function send(socket, event, data) {
  if (socket) {
    socket.send(JSON.stringify({ event: event, data: data }));
  }
}

server.on('connection', function(socket) {

  console.log('connected');

  var client = sockets.length,
      handle = undefined;

  sockets.push(socket);

  socket.on('open', function () {
    send(socket, 'state', objects); // a key frame
  });

  socket.on('message', function (data) {
    var message = JSON.parse(data);
    socket.emit(message.event, message.data);
  });
  
  socket.on('point', function (data) {
    console.log('point', client, data, 'object', handle, 'in', objects.length);
    
    if (handle === undefined) {
      handle = objects.length;
      objects.push([]);
      send(socket, 'handle', handle);
    }
    
    objects[handle].push(data);

    for (var i in sockets) {
      if (i != client) {
        send(sockets[i], 'point', {
          handle: handle,
          point: data
        });
      }
    }
  });

  socket.on('finalize', function (data) {
    console.log('finalize', client, data);
    
    objects[handle] = data;
    
    for (var i in sockets) {
      if (i != client) {
        send(sockets[i], 'finalize', {
          handle: handle,
          curves: data
        });
      }
    }

    handle = undefined;
  });

  socket.on('close', function () {
    console.log('close', client);

    sockets = sockets.splice(sockets.indexOf(socket));
  });
});
