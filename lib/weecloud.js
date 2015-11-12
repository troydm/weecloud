var weechat = require('./weechat');
var util = require('util');

var buffers = 'hdata buffer:%s number,short_name,title,local_variables';
var lines = 'hdata buffer:%s/own_lines/last_line(-%d)/data';

function log(obj){
    console.log(JSON.stringify(obj));
}

function getBuffer(buffer) {
  if (buffer && buffer.pointers) {
    var lc = buffer.local_variables;

    var title = lc.channel;
    var server = lc.server;

    if (!title) title = lc.plugin;
    if (!server) server = 'weechat';

    return {
      id: buffer.pointers[0],
      nick: buffer.nick,
      server: server,
      title: title,
      number: buffer.number,
      type: lc.type
    };
  } else {
    console.error('Buffer has no pointers: ', buffer);
    return null;
  }
}

function getMessage(line) {
  if (typeof line.displayed !== 'undefined' && !line.displayed) return;

  var date = line.date;// new Date(parseInt(line.date, 10) * 1000);
  //log(line);
  //console.log(date);
  var type = 'message';
  var tags = line.tags_array;
  if (!Array.isArray(tags)) tags = [];

  ['join', 'part', 'quit', 'nick'].forEach(function(t) {
    if (tags.indexOf('irc_' + t) >= 0) type = t;
  });

  var nick = tags.map(function(tag) {
    var n = tag.match(/^nick_(\S+)/i);
    return n && n.length >= 2 ? n[1] : null;
  }).filter(function(nick) {
    return nick;
  });
  nick = nick.length > 0 ? nick[0] : null;
  var user = getUser(line.buffer, nick);

  return {
    bufferid: line.buffer,
    from: weechat.style(line.prefix),
    date: date,
    type: type,
    user: user,
    highlight: !! line.highlight,
    message: messageParts(line.message)
  };
}

function getUser(buffer, user) {
  return {
    title: user,
    id: buffer + '-' + user
  };
}

function messageParts(line) {
  return weechat.style(line).map(function(part) {
    return part;
  });
}

exports.connect = function(socket, data, cb) {
  var relayclient = weechat.connect(data.host, data.port, data.password, data.ssl, function() {
    relayclient.send('info version', function(version) {
      version = version.objects[0].content;
      //console.log(data.host, data.port, version.value);
      cb(version.value);
    });
  });

  relayclient.on('error', function(err) {
    console.error(err);
    if (!err.code) err = err.toString();
    else if (err.code === 'ENOTFOUND') err = 'Host not found';
    else if (err.code === 'ECONNREFUSED') err = 'Host refused connection';
    else err = 'Unkown error';

    err = err.replace(/Error: /i, '');
    socket.emit('relayerror', err.toString());
  });

  relayclient.on('open', function(buffers) {
    buffers = buffers.objects[0].content;
    buffers.forEach(function(buffer) {
        //console.log('open buffer '+bufferid);
        //log(buffer);
        var bufferid = buffer.pointers[0];
        queryAndEmitBuffers(bufferid);
    });
  });

  relayclient.on('close', function(buffers) {
    buffers = buffers.objects[0].content;
    buffers.forEach(function(buffer) {
        var bufferid = buffer.pointers[0];
        socket.emit('close:buffer', bufferid);
    });
  });

  relayclient.on('line', function(lines) {
    lines = lines.objects[0].content;
    //console.log('line event catched ');
    //log(lines);
    if (!Array.isArray(lines)) lines = [lines];
    lines.reverse().forEach(function(line) {
      var message = getMessage(line);
      if (!message) return;

      //log(message);
      socket.emit('message', message);
    });
  });

  socket.on('relayinit', function() {
    //console.log('socket init received');
    queryAndEmitBuffers();
  });

  socket.on('msg', function(msg) {
    relayclient.write('input ' + msg.id + ' ' + msg.line);
  });

  socket.on('disconnect', function() {
    //console.log('disconnecting');
    relayclient.disconnect();
  });

  socket.on('get:messages', function(bufferid, count, cb) {
    var query = util.format(lines, '0x'+bufferid, count);
    //console.log('getting messages for '+bufferid);
    //console.log(query);
    relayclient.send(query, function(lines) {
      lines = lines.objects[0].content;
      if (!Array.isArray(lines)) lines = [lines];
      //console.log('getting messages');
      //log(lines);
      var messages = lines.reverse().map(getMessage).filter(function(message) {
        return message;
      });
      cb(messages);
    });
  });

  socket.on('get:users', function(bufferid, cb) {
    var query = 'nicklist';
    if(bufferid)
        query += ' 0x'+bufferid;
    //console.log('sending['+query+']');
    relayclient.send(query, function(users) {
      users = users.objects[0].content;
      //console.log('nicklist received');
      //log(users);
      if (!Array.isArray(users)) users = [users];

      users = users.filter(function(user) {
        return user.level <= 0 && user.visible;
      }).map(function(user) {
        return getUser(bufferid, user.name);
      });
      cb(users);
    });
  });

  socket.on('message', function(bufferid, message) {
    relayclient.send('input 0x' + bufferid + ' ' + message);
  });

  socket.on('open', function(buffer, number) {
    relayclient.send('input 0x' + buffer + ' /buffer ' + number);
  });

  function queryAndEmitBuffers(buffer) {
    if (!buffer) buffer = 'gui_buffers(*)';
    else buffer = '0x'+buffer;
    var query = util.format(buffers, buffer);
    //console.log('query '+query);

    relayclient.send(query, function(buffers) {
      buffers = buffers.objects[0].content;
      if (!Array.isArray(buffers)) buffers = [buffers];

      buffers.forEach(function(buffer) {
        buffer = getBuffer(buffer);
        if (!buffer) return;

        //console.log(JSON.stringify(buffer));
        socket.emit('open:buffer', buffer);
      });
    });
  }
};
