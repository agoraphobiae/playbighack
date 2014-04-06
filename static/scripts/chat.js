// courtesy of youtube api

// load iframe api js
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// make iframe
var player;
var onPReady;
var onPStateChange;
function onYouTubeIframeAPIReady() { // execute as soon as api done
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '40mQRo7MoLA',
    events: {
      'onReady' : onPReady,
      'onStateChange': onPStateChange
    }
  });
}


$(document).ready( function() {
    var preloading = true;
    function onPlayerReady(event) {
      // being preloading
      // TODO: known bug: this sends the API calls as well
      player.playVideo();
      console.log("attemp to play vid 1");
      var checkUntilLoad = function() {
        var loaded = player.getVideoLoadedFraction();
        console.log("get load mt");
        if(loaded == 0) {
            setTimeout(checkUntilLoad, 100);
        } else {
            console.log(loaded);
            player.pauseVideo();
            console.log("paused video");
            // player.seekTo(0, false);
            preloading = false;
        }
      }
      setTimeout(function() {
        checkUntilLoad()
      }, 100);
    }
    onPReady = onPlayerReady;

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
    // 
    // never mind im goin in johnny
    function onPlayerStateChange(event) {
        // alert(preloading);
        if(!preloading) {
            if(event.data == YT.PlayerState.PLAYING) {
                chatAPI.sendPlayback( true,
                    function(played, play) {
                        if(played) {
                            //update UI
                    }
                });
            } else if (event.data == YT.PlayerState.PAUSED) {
                chatAPI.sendPlayback( false, 
                    function(played, play) {
                        if(played) {
                            //update UI
                        }
                    })
            }
        }
    }
    onPStateChange = onPlayerStateChange;




    // chat code

    var chatAPI = {
        connect : function(done) {
            // call the other guy's onMessage
            var that = this;

            var WEB_SOCKET_SWF_LOCATION = '/static/scripts/WebSocketMain.swf';
            
            alert("new ioconnect");
            this.socket = io.connect('/play');
            this.socket.on('connect', done);

            this.socket.on('room message', function(msg) {
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

        register : function(email, onReg) {
            this.socket.emit('register', email, onReg);
        },

        sendMessage : function(msg, onSent) {
            this.socket.emit('message', msg, onSent);
        },

        sendPlayback : function(play, onPlay) {
            this.socket.emit('playback', play, onPlay);
        },

        join : function(room, onJoin) {
            alert("making room api call");
            this.socket.emit('join', room, onJoin);
        }
    };

    var bindUI = function() {
        $(".join-chat").validate({
            submitHandler: function(form) {
                chatAPI.register( $(form).find("[name='email']").val(),
                    function(registered, name) {
                        if(registered) {
                            $(form).hide();
                            $(".compose-message-form").show();
                            $(".messages").show();
                        }
                    });
            }
        });

        $(".compose-message-form").validate({
            submitHandler: function(form) {
                if($(form).find("[name='message']").val().trim() == "") {
                    return false;
                }
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
                            if(play) { player.playVideo(); }
                            else { player.pauseVideo();}
                        }
                    });
            }
        });

        chatAPI.onPlayBack = function(play) {
            if(play) { player.playVideo(); }
            else { player.pauseVideo(); }
        };

        $(".create_room_form").validate({
            submitHandler: function(form) {
                alert("validating room form");
                chatAPI.join( $(form).find("[name='roomname']").val(),
                    function(roomed) {
                        if(roomed) {

                        }
                    });
                form.submit();
            }
        });
    };


    bindUI();

    console.log("Play.");

    chatAPI.connect(function(){
        this.socket.emit('join', window.room)});

    // $(window).ready( function() {
    //     player.addEventListener('onStateChange', onPlayerStateChange);
    // });

    // }($, jQuery, window, player));
});