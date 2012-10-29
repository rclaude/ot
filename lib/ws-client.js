/*global ot */

ot.WebSocketClient = (function () {
  var Client = ot.Client;
  var TextOperation = ot.TextOperation;

  function WebSocketClient(textarea) {
    this.socket = new WebSocket('ws://localhost:1234');
    this.fromServer = false;
    var self = this;
    socket.on('start', function (obj) {
      Client.call(self, obj.revision);
      self.initializeWebSocket(obj.str);
      self.initializeSocket();
    });
  }

  inherit(WebSocketClient, Client);

  WebSocketClient.prototype.initializeSocket = function () {
    var self = this;
    this.socket
      .on('ack', function () { self.serverAck(); })
      .on('operation', function (obj) {
        var operation = new WrappedOperation(
          TextOperation.fromJSON(obj.operation),
          OtherMeta.fromJSON(obj.meta)
        );
        console.log("Operation from server by client " + obj.meta.clientId + ":", operation);
        self.applyServer(operation);
      });
  };

  WebSocketClient.prototype.initializeWebSocket = function (str) {
    var self = this;
    textarea.setValue(str);
    this.oldValue = str;
    var dmp = new diff_match_patch();
    textarea.onchange = textarea.onkeyup = function myDiff(){
      var newValue = textarea.value;
      var d = dmp.diff_main(this.oldValue, newValue);
      dmp.diff_cleanupEfficiency(d);
      self.onWebSocketChange(d); 
      this.oldValue = newValue;
    };
  };
 
  function fromDelta(delta) {
    var operation = new TextOperation();
    for(var i=0; i<delta.length; i++){
      switch(delta[i][0]){
      case -1:
        operation.delete(delta[i][1]);
        break;
      case 0:
        operation.retain(delta[i][1].length);
        break;
      case 1:
        operation.insert(delta[i][1]);
        break;
      }
    return operation;
  };
   
  WebSocketClient.prototype.onWebSocketChange = function (change) {
    var oldValue = this.oldValue;
    this.oldValue = this.textarea.value;
    try {
      if (!this.fromServer) {
        var operation = fromDelta(change);
        this.applyClient(operation);
      }
    } finally {
      this.fromServer = false;
    }
  };

  WebSocketClient.prototype.sendOperation = function (revision, operation) {
    console.log(revision, operation);
    this.socket.emit('operation', {
      revision: revision,
      operation: operation.toJSON()
    });
  };

  TextOperation.prototype.applyToTextarea(textarea){
    // TODO : take operation modification into account for start and end
    var start = textarea.selectionStart, 
        end = textarea.selectionEnd;
    textarea.value = this.apply(textarea.value);
    textarea.selectionStart = start;
    textarea.selectionEnd = end;
  };

  WebSocketClient.prototype.applyOperation = function (operation) {
    this.fromServer = true; 
    operation.applyToTextarea(this.textarea);
  };

  // Set Const.prototype.__proto__ to Super.prototype
  function inherit (Const, Super) {
    function F () {}
    F.prototype = Super.prototype;
    Const.prototype = new F();
    Const.prototype.constructor = Const;
  }

  return WebSocketClient;
}());
