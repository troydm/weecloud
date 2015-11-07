WeeCloud
========

Node.js web interface for WeeChat Relay

NOTE: this is a fork with folowing modifications:
* Dark interface
* Socket.io updated to latest 1.3.7    
* Latest weechat.js is now part of it instead of being separate module
![weecloud dark](http://i.imgur.com/rHPG2km.png)
    

Usage
---

**WeeChat**

Require [WeeChat 1.0] or later (http://www.weechat.org/download/).   
Start WeeChat Relay Protocol:  

    /set relay.network.password test
    /relay add weechat 8000

### Running locally

    git clone https://github.com/eirikb/weecloud
    cd weecloud
    npm install
    node app.js

weechat will run on a default port of 3000.

Contribution
---

Contributers:  

*  [dennis](https://github.com/dennisse)
*  Pingu1
*  [troydm](https://github.com/troydm)

Special thanks to:  

*  xt
*  FlashCode


License
---

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
(c) Eirik Brandtzæg
