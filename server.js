var ws = require('ws'),
    fs = require('fs'),
    http = require('http'),
    util = require('util'),
    formidable = require('formidable');

/* UTILS */

function send(socket, event, data) {
  if (socket) {
    try { socket.send(JSON.stringify({ event: event, data: data })); }
    catch(e) { 
      console.error(e);
      console.error('WARNING : socket', sockets.indexOf(socket),'fail => we remove it leaving',sockets.length - 1,'client(s)'); 
      sockets.splice(sockets.indexOf(socket), 1);
    }
  }
}

function broadcast (from, event, data) {
  var fromIdx = sockets.indexOf(from);
  for (var i = 0, len = sockets.length ; i < len; i++) 
    if (i != fromIdx) send(sockets[i], event, data);
}


/* COLLABORATION SERVER */

var server = new ws.Server({ port: +process.argv[2] || 1234 }),
    sockets = [], objects = {}, objRev = 0;

server.on('connection', function(socket) {

  var handle = undefined;
  sockets.push(socket);

  send(socket, 'state', objects); // first key frame

  console.log('new client join =>', sockets.length, 'client(s)');
  broadcast(null, 'nbUsers', sockets.length);

  socket.on('message', function (data) {
    var message = JSON.parse(data);
    socket.emit(message.event, message.data);
  });
  
  socket.on('point', function (data) {
    if (handle === undefined) {
      var path = {
        color: data.color,
        width: data.width,
        segments: []
      }
      objects[objRev] = path;
      handle = objRev++;
      console.log('handle', handle, 'on POINT \t client', socket.upgradeReq.headers.origin);
      send(socket, 'handle', handle);
    }
    objects[handle].segments.push(data);
    broadcast(socket, 'point', { handle: handle, point: data });
  });

  socket.on('path', function (data) {
    if (data.handle === undefined) {
      objects[objRev] = [];
      handle = data.handle = objRev++;
      send(socket, 'handle', handle);
      console.log('handle', handle, 'on PATH \t client', socket.upgradeReq.headers.origin);
    }
    objects[data.handle] = data.obj;
    broadcast(socket, 'path', data);
    if (handle === data.handle) handle = undefined;
  });

  socket.on('move', function(data) {
    var obj = objects[data.handle];
    switch (obj.type) {
      case 'raster':
          obj.position.x += data.move.x;
          obj.position.y += data.move.y;
      default:
        if (!obj.move) {
          obj.move = data.move;
        } else {
          obj.move.x += data.move.x;
          obj.move.y += data.move.y;
        }
    }
    broadcast(socket, 'move', data);
  });

  socket.on('delete', function(data) {
    delete objects[data];
    broadcast(socket, 'delete', data);
  });

  socket.on('close', function () {
    console.log('client', sockets.indexOf(socket), 'left');
    sockets.splice(sockets.indexOf(socket), 1);
    broadcast(null, 'nbUsers', sockets.length);
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
      objects[objRev] = {type: 'raster', handle: objRev, id: id, position: { x: 500, y: 300 } };
      broadcast(null, 'raster', { handle: objRev++, id: id, position: { x: 500, y: 300 } });
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
