var Protocol = require('./protocol');
var zlib = require('zlib');
if (!zlib) {
    throw new Error('Zlib is currently not available');
}
(function() {

  function Parser(cb) {
    var self = this;
    var buffer = new Buffer(0);
    var total = 0;
    var unzipping = false;
    var protocol = new Protocol.Protocol();

    function parseData(data) {
      protocol._setData(data);
      // Remove total from data
      protocol._getInt();
      compression = protocol._getChar();
      var id = protocol._getString(),
          obj = protocol.parse(data);

      if (cb) cb(id, obj);
      total = 0;
    }

    function handleData(data) {
      //console.log('handleData '+data);
      protocol._setData(data);
      // Remove total from data
      protocol._getInt();
      compression = protocol._getChar();
      data = protocol._getData();

      if (compression) {
        unzipping = true;
        var header = data.slice(0,5);
        data = data.slice(5);
        zlib.unzip(data, function(err, data) {
          unzipping = false;
          if (err) throw err;
          data = concatBuffers(header,data);
          parseData(data);
          self.onData();
        });
      } else {
        parseData(data);
        self.onData();
      }
    }

    function concatBuffers(bufferA, bufferB) {
      var buffer = new Buffer(bufferA.length + bufferB.length);
      bufferA.copy(buffer);
      bufferB.copy(buffer, bufferA.length);
      return buffer;
    }

    self.onData = function(part) {
      var data;

      if (part) buffer = concatBuffers(buffer, part);

      // Need at least 1 int (4 bytes) in buffer
      if (!unzipping && buffer.length > 4) {
        if (total === 0) {
          protocol._setData(buffer);
          total = protocol._getInt();
        }

        // Ready to parse buffer
        if (buffer.length >= total) {
          data = buffer.slice(0, total);
          buffer = buffer.slice(total);
          total = 0;
          handleData(data);
        }
      }
    };
  }

  exports.Parser = Parser;
})();
