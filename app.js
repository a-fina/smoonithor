var flatiron = require('flatiron'),
    path = require('path'),
    fs = require('fs'),
    Tail = require('tail').Tail,
    ecstatic = require('ecstatic');

var spawn = require('child_process').spawn;

function getFileName(){
  var d = new Date();
  var dt = d.getDate();
  var mt = d.getMonth() +1;
  var yr = d.getFullYear();

  if (dt < 10)
    dt = "0" + dt;
  if (mt < 10)
    mt = "0" + mt;

  //return "/home/alessio/workspace/node.js/smoonithor/filename"+yr+mt+dt+".log";
  return "/home/alessio/workspace/node.js/smoonithor/filename.log";
}

var filename = getFileName();
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

var gPattern = new RegExp(/.*OK.*/);
var rPattern = new RegExp(/.*ERROR.*/);

sio.sockets.on('connection', function (socket) {
  /*sent by client 
  socket.on('my other event', function (data) {
    console.log(data);
  }); */


  /*
   * Update client chart every 1000 sec.
   */
  var g_old_value, g_diff_value = 0;
  var r_old_value, r_last_value, r_diff_value = 0;
  var g_last_value = 0;
  var r_last_value = 0;
  var number = null;
  // Update client chart every 1000 sec.
  setInterval(function() {
      g_diff_value = g_last_value - g_old_value;
      g_old_value = g_last_value;
      r_diff_value = r_last_value - r_old_value;
      r_old_value = r_last_value;

 // DEBUG     
      socket.emit('news',{ debug: 'string emit news' });
      socket.emit('new-point',{
        x: new Date().getTime(), 
        gy: g_diff_value,
        ry: r_diff_value 
      });

      g_diff_value = 0;
      r_diff_value = 0;
  }, 1000);

  /*
   * Wait for new line and get last_value 
   */
  filename = getFileName();
  var tail = spawn("tail", ["-f", filename]);
  tail.stdout.on("data", function (data) {
  //tail.on("line", function(data) { NOT work on all system
      if  ( (number = data.toString().match(rPattern)) != null){	
      	r_last_value  += 1;
        console.log("rPattern match:" + r_last_value);
      }
      if  ( (number = data.toString().match(gPattern)) != null){	
      	g_last_value  += 1;
        console.log("gPattern match: " + g_last_value);
      }
  });
});

console.log('Listening on :3000');
