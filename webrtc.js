window.WebRTC = (function () {

  var DataChannel = function (url) {
    this.socket = new WebSocket(url);
    this.handlers = {};
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
    this.socket.onmessage = this.onmessage.bind(this);
  };

  DataChannel.prototype = {

    on: function (event, callback) {
      this.handlers[event] = callback;
    },

    onopen: function () {
      this.emit('open');
    },

    onclose: function () {
      this.emit('close');
    },

    onmessage: function(message) {
      message = JSON.parse(message.data);
      this.emit(message.event, message.data);
    },

    emit: function(event, data) {
      if (this.handlers[event]) {
        this.handlers[event] (data);
      }
    },

    send: function(event, data) {
      this.socket.send(JSON.stringify({ event: event, data: data }));
    }

  };

  return { DataChannel: DataChannel };

})();
