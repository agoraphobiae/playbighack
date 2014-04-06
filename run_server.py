from playbighack import application
from gevent import monkey
from socketio.server import SocketIOServer

monkey.patch_all()

if __name__ == "__main__":
    print 'Listening on http://127.0.0.1:%s and on port 10843 (flash policy server)' % application.config["PORT"]
    SocketIOServer(
        ("", application.config["PORT"]),
        application, resource="socket.io").serve_forever()
