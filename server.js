var ws = require('ws'),
    fs = require('fs'),
    http = require('http'),
    util = require('util'),
    formidable = require('formidable');

/* UTILS */

function send(socket, event, data) {
  if (socket) {
    try { socket.send(JSON.stringify({ event: event, data: data })); }
    catch(e) { console.error('WARNING : a disconnected client is still in the socket list'); }
  }
}

function broadcast (from, event, data) {
  for (var i = 0 ; i < sockets.length ; i++) if (i != from) send(sockets[i], event, data);
}


/* COLLABORATION SERVER */

var server = new ws.Server({ port: +process.argv[2] || 1234 }),
    sockets = [], objects = [];

server.on('connection', function(socket) {

  var client = sockets.push(socket) - 1, handle = undefined;
  send(socket, 'state', objects); // first key frame

  console.log('client', client, 'join');

  socket.on('message', function (data) {
    var message = JSON.parse(data);
    socket.emit(message.event, message.data);
  });
  
  socket.on('point', function (data) {
    //console.log('point', client, data, 'object', handle, 'in', objects.length);
    if (handle === undefined) {
      handle = objects.push([]) - 1;
      send(socket, 'handle', handle);
    }
    objects[handle].push(data);
    broadcast(client, 'point', { handle: handle, point: data });
  });

  socket.on('path', function (data) {
    //console.log('path', client, data);
    objects[data.handle] = data.obj;
    broadcast(client, 'path', data);
    if(handle === data.handle) handle = undefined;
  });

  socket.on('move', function(data) {
    //console.log('move', client, data)
    switch (data.type) {
    case 'raster':
        objects[data.handle].position.x += data.move.x;
        objects[data.handle].position.y += data.move.y;
    default:
      if (!objects[data.handle].move) {
        objects[data.handle].move = data.move;
      } else {
        objects[data.handle].move.x += data.move.x;
        objects[data.handle].move.y += data.move.y;
      }
    }
    broadcast(client, 'move', data);
   
  });

  socket.on('delete', function(data) {
    //console.log('delete', client, data);
    objects[data] = null;
    broadcast(client, 'delete', data);
  });

  socket.on('close', function () {
    console.log('client', client, 'left');
    sockets.splice(client);
  });
});


/* UPLOADER */

var uploads = [];

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // parse a file upload
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
      var id = uploads.push(files.upload.path) - 1;
      var handle = objects.push({type: 'raster', handle: handle, id: id}) - 1;
      broadcast(null, 'raster', { handle: handle, id: id });
      res.end('yes');
    });
    return;
  } else if (req.url.slice(0,5) == '/img/') {
    var id = parseInt(req.url.slice(5),10);
    if (uploads[id]) {
      fs.createReadStream(uploads[id]).pipe(res);
      return;
    }
  }
  res.end('no');
}).listen(8080);
