var flatiron = require('flatiron'),
    path = require('path'),
    fs = require('fs'),
    Tail = require('tail').Tail,
    ecstatic = require('ecstatic');

var spawn = require('child_process').spawn;

var filename = "filename.log";
fs.statSync(filename);
console.log('Monitoring:' + filename);

tail = new Tail(filename);
app = flatiron.app;

/*
 * Flatiron configuration
 */
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http, {
  before: [
    ecstatic(__dirname + '/public')
  ]

});

app.router.get('/', function () {
  this.res.json({ 'hello': 'world' })
});

app.start(3000);


/*
 * Web Socket.io Communication
 */
var sio = require('socket.io').listen(app.server);

var rePattern = new RegExp(/.* put here a string to match and an incremental number: (\d+).*/);

sio.sockets.on('connection', function (socket) {
  /*sent by client 
  socket.on('my other event', function (data) {
    console.log(data);
  }); */


  /*
   * Update client chart every 1000 sec.
   */
  var old_value, last_value, diff_value = 0;
  var number = null;
  // Update client chart every 1000 sec.
  setInterval(function() {
      diff_value = last_value - old_value;
      old_value = last_value;

 // DEBUG     socket.emit('news',{ debug: 'string emit news' });
      socket.emit('new-point',{
        x: new Date().getTime(), 
        y: diff_value
      });

      diff_value = 0;
  }, 1000);

  /*
   * Wait for new line and get last_value 
   */
  var tail = spawn("tail", ["-f", filename]);
  tail.stdout.on("data", function (data) {
  //tail.on("line", function(data) { NOT work on all system
      if  ( (number = data.toString().match(rePattern)) != null){	
      	last_value  = number[1];
      }
  });
});

console.log('Listening on :3000');
