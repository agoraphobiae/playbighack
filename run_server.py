from playbighack import application
from gevent import monkey

monkey.patch_all()

if __name__ == "__main__":
	SocketIOServer(
		("", application.config["PORT"]),
        application, resource="socket.io").serve_forever()
