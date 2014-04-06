(function($,window){

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
        },

        join : function(email, onJoin) {
            this.socket.emit('join', email, onJoin);
        },

        sendMessage : function(msg, onSent) {
            this.socket.emit('message', msg, onSent);
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
    };

    var ready = function() {

        bindUI();

        console.log("Play.");

        chatAPI.connect(function(){});
    };


    $(function() { ready(); } );
}($,window));