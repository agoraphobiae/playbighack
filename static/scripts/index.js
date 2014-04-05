$(function() {
  console.log("Play.");
  var socket = io.connect('/play');
  socket.on('connect', function() {
    socket.emit('join', 'Bob', function(joined, name) {
    	socket.emit('message', 'heya from ' + name, function(sent) {
    		console.log("message sent:", sent);
    	});
    });
  });

  socket.on('message', function(message) {
  	alert("you got a message: " + message);
  });
});