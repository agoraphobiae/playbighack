// courtesy of youtube api

// load iframe api js
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// make iframe
var player;
function onYouTubeIframeAPIReady() { // execute as soon as api done
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '40mQRo7MoLA',
    events: {
      'onReady' : onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  // being preloading
  player.playVideo();
  player.stopVideo();
}

function stopVideo() {
  player.stopVideo();
}


// okay so the above iframe ready function needs
// to be exposed globally for YT
// but then the below chat code was enclosed
// in an anon func i was calling for speed
// but even when passing in the player
// player is nul until the above iframe ready f
// is called so the add listener call won't go through
// and onplayerstate needs to be in the same scope
// as chat API
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.PLAYING) {
        chatAPI.sendPlayback( true,
            function(played, play) {
                if(played) {
                //update UI
            }
        });
    }
}

// chat code

var chatAPI = {
    connect : function(done) {
        // call the other guy's onMessage
        var that = this;

        this.socket = io.connect('/play');
        this.socket.on('connect', done);

        this.socket.on('message', function(msg) {
            if(that.onMessage) {
                that.onMessage(msg);
            }
        });

        this.socket.on('playback', function(play) {
            if(that.onPlayBack) {
                that.onPlayBack(play);
            }
        });
    },

    join : function(email, onJoin) {
        this.socket.emit('join', email, onJoin);
    },

    sendMessage : function(msg, onSent) {
        this.socket.emit('message', msg, onSent);
    },

    sendPlayback : function(play, onPlay) {
        this.socket.emit('playback', play, onPlay);
    }
};

var bindUI = function() {
    $(".join-chat").validate({
        submitHandler: function(form) {
            chatAPI.join( $(form).find("[name='email']").val(),
                function(joined, name) {
                    if(joined) {
                        alert("you've joined chat");
                        $(form).hide();
                        $(".compose-message-form").show();
                        $(".messages").show();
                    }
                });
        }
    });

    $(".compose-message-form").validate({
        submitHandler: function(form) {
            chatAPI.sendMessage( $(form).find("[name='message']").val(),
                function(sent, msg) {
                    if(sent) {
                        $(".messages").append(
                            jQuery("<li>").html(
                                "<b>Me</b>: " + msg
                            )
                        );
                    }
                });
        }
    });

    chatAPI.onMessage = function(msg) {
        $(".messages").append(
            jQuery("<li>").html(
                "<b>"+msg.sender+"</b>"+msg.content
            )
        );
    };

    $(".playercontrols").validate({
        submitHandler: function(form) {
            chatAPI.sendPlayback( true, 
                function(played, play) {
                    if(played) {
                        player.playVideo();
                    }
                });
        }
    });

    chatAPI.onPlayBack = function(play) {
        player.playVideo();
    };
};

var ready = function() {

    bindUI();

    console.log("Play.");

    chatAPI.connect(function(){});
};


$(function() { ready(); } );

// $(window).ready( function() {
//     player.addEventListener('onStateChange', onPlayerStateChange);
// });

// }($, jQuery, window, player));