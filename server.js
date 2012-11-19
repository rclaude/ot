var ws = require('ws');

var server = new ws.Server({ port: +process.argv[2] || 1234 });

var sockets = [];
var objects = [];

function send(socket, event, data) {
  if (socket) {
    try{
      socket.send(JSON.stringify({ event: event, data: data }));
    }catch(e){
      console.log('WARNING : a disconnected client is still in the socket list');
    }
  }
}

function broadcast (from, type, data){
  for (var i in sockets) 
    if (i != from) 
      send(sockets[i], type, data)
}

server.on('connection', function(socket) {

  console.log('connected');

  var client = sockets.length,
      handle = undefined;

  sockets.push(socket);

  send(socket, 'state', objects); // a key frame

  /*
  socket.on('open', function () {
    console.log('open -> give state');
    send(socket, 'state', objects); // a key frame
  });
  */

  socket.on('message', function (data) {
    var message = JSON.parse(data);
    socket.emit(message.event, message.data);
  });
  
  socket.on('point', function (data) {
    //console.log('point', client, data, 'object', handle, 'in', objects.length);
    
    if (handle === undefined) {
      handle = objects.length;
      objects[handle] = [];
      send(socket, 'handle', handle);
    }
    
    objects[handle].push(data);
    broadcast(client, 'point', { handle: handle, point: data });
  });

  socket.on('finalize', function (data) {
    //console.log('finalize', client, data);
    
    objects[handle] = data;
    broadcast(client, 'finalize', { handle: handle, obj: data });
    handle = undefined;
  });

  socket.on('move', function(data) {
    //console.log('move', client, data)

    if (!objects[data.handle].move) 
      objects[data.handle].move = data.move;
    else { 
      objects[data.handle].move.x += data.move.x;
      objects[data.handle].move.y += data.move.y;
    }
    broadcast(client, 'move', data);
  });

  socket.on('delete', function(data) {
    //console.log('delete', client, data);

    broadcast(client, 'delete', data);
  });

  socket.on('close', function () {
    //console.log('close', client, sockets.indexOf(socket));

    sockets.splice(sockets.indexOf(socket));
  });
});
