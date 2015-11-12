$(function() {

  servers = new ServerCollection();
  buffers = new BufferCollection();
  inputView = new InputView();

  Buffer.isBuffer = function isBuffer(b) {
    return b instanceof Buffer;
  };

  function removeBuffer(buffer){
    var server = servers.findServerByBuffer(buffer);
    server.get('buffers').remove(server.get('buffers').get(buffer));
    buffers.remove(buffers.get(buffer));

    $("optgroup[label='"+server.id+"'] > option[value='"+buffer+"']").remove();
    var li = $("#bufferlist ul li > a[href='#"+buffer+"']").parent();
    var active = li.attr('class') == 'active';
    li.remove();

    if(active){
        //$("#buffers > div").empty();    
    }
  }

  function addBuffer(buffer) {
    var server = servers.get(buffer.server);
    if (!server) {
      server = new Server({
        title: buffer.server,
        id: buffer.server
      });

      servers.add(server);
      var serverView = new ServerView({
        model: server
      });
      $('#bufferlist ul').append(serverView.render().$el);

      var dropdownBufferView = new DropdownBufferView({
        model: server
      });
      $('select').append(dropdownBufferView.render().$el);
    }

    buffer = new Buffer(buffer);
    server.get('buffers').add(buffer);
    buffers.add(buffer);

    if ($('#bufferlist .active').length > 0) return;
    $('#bufferlist a').tab('show');
  }

  socket = io();

  socket.on('open:buffer', function(buffer) {
    console.log('open buffer received');
    addBuffer(buffer);
  });

  socket.on('close:buffer', function(buffer) {
    console.log('close buffer received');
    removeBuffer(buffer);
  });

  socket.on('message', function(message) {
    var buffer = buffers.get(message.bufferid);
    if (!buffer) {
      console.log('Unknown buffer: ', message.bufferid);
      return;
    }

    buffer.get('messages').add(message);

    var type = message.type;
    var user = message.user;
    var users = buffer.get('users');
    if (type === 'join') users.add(user);
    else if (type === 'part') users.remove(user);
  });

  socket.on('relayerror', function(err) {
    $('#error').text(err).show();
  });

  $('.tip').tooltip();
  $('select').select2({
    width: '100%'
  }).change(function() {
    var val = $(this).val();
    $('[href=#' + val + ']').click();
  });
});
