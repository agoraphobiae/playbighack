import re
import unicodedata
from os.path import dirname, abspath, join

from flask import Flask, render_template, request, Response, redirect, \
url_for
from flask.ext.sqlalchemy import SQLAlchemy
from gevent import monkey
from socketio import socketio_manage
from socketio.namespace import BaseNamespace
from socketio.mixins import BroadcastMixin, RoomsMixin
from werkzeug.exceptions import NotFound

monkey.patch_all()

# app config and view
application = Flask(__name__)
application.debug = True
application.config['PORT'] = 5000

_cwd = dirname(abspath(__file__))
application.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + join(_cwd, 'playbighack.db')
application.config['SQLALCHEMY_ECHO'] = True
application.logger.info(application.config['SQLALCHEMY_DATABASE_URI'])
db = SQLAlchemy(application)

@application.route('/', methods=['GET'])
def index():
    return render_template("index.html")

@application.route('/<path:slug>')
def room(slug):
    context = {"room": get_object_or_404(ChatRoom, slug=slug)}
    return render_template('room.html', **context)

@application.route('/create', methods=['POST'])
def create():
    # creates a new room and redirects to it
    name = request.form.get("roomname")
    if name:
        room, create = get_or_create(ChatRoom, name=name)
        return redirect(url_for('room', slug=room.slug))
    return redirect(url_for('/'))


# db models
class ChatRoom(db.Model):
    __tablename__ = 'chatrooms'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    slug = db.Column(db.String(50))
    user = db.relationship('ChatUser', backref='chatroom',
        lazy='dynamic')

    def __unicode__(self):
        return self.name

    def get_absolute_url(self):
        return url_for('room', slug=self.slug)

    def save(self, *agrs, **kwargs):
        # add this chatroom to the db
        if not self.slug:
            self.slug = slugify(self.name)
        db.session.add(self)
        db.session.commit()

class ChatUser(db.Model):
    __tablename__ = 'chatusers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    session = db.Column(db.String(20), nullable=False)
    chatroom_id = db.Column(db.Integer, db.ForeignKey('chatrooms.id'))

    def __unicode__(self):
        return self.name


# util functions
def slugify(value):
    # prepare for commit to db
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore')
    value = unicode(re.sub('[^\w\s-]', '', value).strip().lower())
    return re.sub('[-\s]+', '-', value)

def get_object_or_404(objclass, **query):
    instance = objclass.query.filter_by(**query).first()
    if not instance:
        raise NotFound()
    return instance

def get_or_create(objclass, **kwargs):
    try:
        return get_object_or_404(objclass, **kwargs), False
    except NotFound:
        instance = objclass(**kwargs)
        instance.save()
        return instance, True


# API socket io namespace
class PlayNamespace(BaseNamespace, RoomsMixin, BroadcastMixin):
    # a chatroom

    names = []

    def initialize(self):
        self.logger = application.logger
        self.log("Socketio session started")

    def log(self, msg):
        self.logger.info("[%s] {%s}"%(self.socket.sessid, msg))

    # def recv_connect(self):
    #     self.log("New connection")
    #     self.connect()

    def recv_disconnect(self):
        self.log("Client disconnected")
        self.names.remove(self.session['email'])
        self.disconnect(silent=True)
        return True

    def on_register(self, name):
        self.log("%s registered" % name)
        self.session['email'] = name
        self.names.append(name)
        return True, name

    def on_join(self, room):
        self.log("room %s accessed"%room)
        self.room = room
        self.join(room)
        return True

    def on_message(self, msg):
        self.log('got a message: %s' % msg)
        self.emit_to_room(self.room, 'room message',
            self.session['email'], msg)
        return True

    def on_playback(self, play):
        self.log('got a playback request')
        self.broadcast_event_not_me("playback", play)
        return True, play




@application.route('/socket.io/<path:remaining>')
def socketio(remaining):
    # application.logger.info('accessing endpt %s'%endpt)
    try:
        socketio_manage(request.environ, {'/play': PlayNamespace}, request)
    except:
        application.logger.error("Exception while handling socketio connection",
                exc_info=True)
    return Response()

# gonna need this
def init_db():
    db.create_all(app=application)
init_db()