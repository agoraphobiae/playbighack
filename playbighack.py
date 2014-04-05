from flask import Flask, render_template
from gevent import monkey

monkey.patch_all()

application = Flask(__name__)
application.debug = True
application.config['PORT'] = 5000

@application.route('/', methods=['GET'])
def index():
	return render_template("index.html")

