from flask import Flask, render_template
from gevent import monkey

monkey.patch_all()

app = Flask(__name__)
app.debug = True
app.config['PORT'] = 5000

@app.route('/', methods=['GET'])
def index():
	return render_template("index.html")

