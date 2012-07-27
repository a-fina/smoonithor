/*
 * Tail on file , match string and count matched lines
 * Every errorsSize lines, send a notification mail
 *
 * @author bayois
 */

var nodemailer = require("nodemailer"),
    Tail = require('tail').Tail;

var filename = "filename.log";
console.log('Monitoring:' + filename);
tail = new Tail(filename);

function sendMail(data){

  // create reusable transport method (opens pool of SMTP connections)
  var smtpTransport = nodemailer.createTransport("SMTP",{ host: "172.16.16.1" });

  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: "XXX <xyz@xyz.com>", // sender address
      to: "x.y@z.com", // list of receivers
      subject: "Monitoring - last "+  data.length + " errors" , // Subject line
      text: JSON.stringify(data), // plaintext body
      html: data.toString().replace("\n","<br/>")// html body
  }

  // send mail with defined transport object
  smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
          console.log(error);
      }else{
          console.log("Message sent: " + response.message);
      }
      // if you don't want to use this transport object anymore, uncomment following line
      smtpTransport.close(); // shut down the connection pool, no more messages
  });
}



var errors = new Array();
var countError = 0;
var errorsSize = 25;

tail.on("line", function(data) {
  if (data.toString().match(/.* ERROR .*/m)){
    errors.push(data.toString()+"<br/>");
    countError += errorsSize; // if any ERROR send it immediately
  } 
  else if (data.toString().match(/.*Exception.*/m)){
    errors.push(data.toString()+"<br/>");
    countError += 1; // if exception take all rows
  }
  else if ( ! data.toString().match(/.*\[Spool Thread #(\d+).*/m)) {
    errors.push(data.toString()+"<br/>");
    countError += 1; // if exception take all rows
  }
  else {
    countError = 0;
  }
  if ( countError >= errorsSize){
    sendMail(errors); 
    //console.log(errors);
    delete errors;
    errors = new Array();
    countError = 0;
  }
});
