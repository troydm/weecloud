ServerCollection = Backbone.Collection.extend({
  model: Server,
  findServerByBuffer: function(buffer){
      var found = null;
      this.each(function(server){
          if(server.getBuffer(buffer) !== undefined)                          
            found = server;
      });
      return found;
  }
});

BufferCollection = Backbone.Collection.extend({
  model: Buffer,

  initialize: function() {
    this.active = null;
    this.listenTo(this, 'open', this.setActive, this);
  },

  setActive: function(buffer) {
    this.active = buffer;
  },

  getMentioned: function() {
    return _.any(this.models, function(model) {
      return model.get('mentioned');
    });
  },

  getActivity: function() {
    return _.reduce(this.models, function(memo, model) {
      return memo + model.get('activity');
    }, 0);
  }
});

MessageCollection = Backbone.Collection.extend({
  model: Message
});

UserCollection = Backbone.Collection.extend({
  model: User
});
