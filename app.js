var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var weecloud = require('./lib/weecloud');

var package = require('./package.json');
package.options = package.options || {};

server.listen(process.env.PORT || 3000);

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.render('index', package);
});

io.on('connection', function(socket) {
  socket.on('relayconnect', function(data) {
    socket.relayclient = weecloud.connect(socket, data, function(version) {
      socket.emit('relayconnected',version);
    });
  });
});
