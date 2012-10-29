window.WebRTC = (function () {

  var DataChannel = function (url) {
    this.socket = new WebSocket(url);
    this.handlers = {};
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onmessage = this.onmessage.bind(this);
  };

  DataChannel.prototype = {

    on: function (event, callback) {
      this.handlers[event] = callback;
    },

    onopen: function () {
      console.log('open');
    },

    onmessage: function(message) {
      message = JSON.parse(message.data);
      if (this.handlers[message.event]) {
        this.handlers[message.event] (message.data);
      }
    },

    emit: function(event, data) {
      console.log('this should not happen');
      this.socket.emit(event, data);
    },

    send: function(event, data) {
      this.socket.send(JSON.stringify({ event: event, data: data }));
    }

  };

  return { DataChannel: DataChannel };

})();
