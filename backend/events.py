from app import socketio
from routes.users import online_users

sid_to_user: dict[str, dict] = {}

@socketio.on("connect")
def on_connect():
    pass

@socketio.on("join")
def on_join(data):
    from flask_socketio import join_room, request as sock_request
    from models import User
    user_id = data.get("user_id")
    username = data.get("username")
    conv_id = data.get("conversation_id")

    if user_id and username:
        user = User.query.get(user_id)
        status = (user.status or "") if user else ""
        sid_to_user[sock_request.sid] = {"id": user_id, "username": username}
        online_users[user_id] = {"username": username, "status": status}
        socketio.emit("online_users", [
            {"id": uid, "username": info["username"], "status": info.get("status", "")}
            for uid, info in online_users.items()
        ])

    if conv_id:
        join_room(conv_id)

@socketio.on("leave")
def on_leave(data):
    from flask_socketio import leave_room
    conv_id = data.get("conversation_id")
    if conv_id:
        leave_room(conv_id)

@socketio.on("typing")
def on_typing(data):
    conv_id = data.get("conversation_id")
    if conv_id:
        socketio.emit("user_typing", data, room=conv_id, include_self=False)

@socketio.on("stop_typing")
def on_stop_typing(data):
    conv_id = data.get("conversation_id")
    if conv_id:
        socketio.emit("user_stop_typing", data, room=conv_id, include_self=False)

@socketio.on("disconnect")
def on_disconnect():
    from flask_socketio import request as sock_request
    user = sid_to_user.pop(sock_request.sid, None)
    if user:
        online_users.pop(user["id"], None)
        socketio.emit("online_users", [
            {"id": uid, "username": info["username"], "status": info.get("status", "")}
            for uid, info in online_users.items()
        ])
