from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from dotenv import load_dotenv
from models import db
import os

load_dotenv()

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///tone.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = os.path.abspath(os.getenv("UPLOAD_FOLDER", "uploads"))
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    JWTManager(app)
    socketio.init_app(app)

    from routes.auth import auth_bp
    from routes.conversations import conv_bp
    from routes.messages import msg_bp
    from routes.users import users_bp
    from routes.analyze import analyze_bp
    from routes.upload import upload_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(conv_bp, url_prefix="/api/conversations")
    app.register_blueprint(msg_bp, url_prefix="/api/messages")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(analyze_bp, url_prefix="/api")
    app.register_blueprint(upload_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    return app
