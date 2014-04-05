from playbighack import app
from gevent import monkey

monkey.patch_all()

if __name__ == "__main__":
	SocketIOServer(
		("", app.config["PORT"]),
		app, resource="socket.io").serve_forever()
