from app import create_app, socketio
import events  # noqa: F401 - registers socket event handlers

app = create_app()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
