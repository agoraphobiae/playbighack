from flask import Flask, render_template, request, Response
from gevent import monkey
from socketio import socketio_manage
from socketio.namespace import BaseNamespace
from socketio.mixins import BroadcastMixin

monkey.patch_all()

application = Flask(__name__)
application.debug = True
application.config['PORT'] = 5000

@application.route('/', methods=['GET'])
def index():
    return render_template("index.html")

@application.route('/socket.io/<path:endpt>')
def socketio(endpt):
    try:
        socketio_manage(request.environ, {'/play': PlayNamespace}, request)
    except:
        application.logger.error("Exception while handling socketio connection",
                exc_info=True)
        return Response()


class PlayNamespace(BaseNamespace, BroadcastMixin):
    def initialize(self):
        self.logger = application.logger
        self.log("Socketio session started")

    def log(self, msg):
        self.logger.info("[%s] {%s}"%(self.socket.sessid, msg))

    def recv_connect(self):
        self.log("New connection")

    def recv_disconnect(self):
        self.log("Client disconnected")

    def on_join(self, name):
        self.log("%s join chat" % name)
        return True, name

    def on_message(self, msg):
        self.log('got a message: %s' % msg)
        self.broadcast_event_not_me("message", msg)
        return True, msg
