import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

# In-memory online users: { user_id: {username, status} }
online_users: dict[str, dict] = {}


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = None
        self.rooms = set()
        await self.accept()

    async def disconnect(self, code):
        if self.user_id and self.user_id in online_users:
            online_users.pop(self.user_id, None)
            await self.channel_layer.group_send(
                "presence",
                {"type": "presence.update", "users": _online_list()},
            )
        for room in self.rooms:
            await self.channel_layer.group_discard(room, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data.get("type")

        if event == "join":
            await self._handle_join(data)
        elif event == "leave":
            await self._handle_leave(data)
        elif event == "typing":
            await self._handle_typing(data)
        elif event == "stop_typing":
            await self._handle_stop_typing(data)

    async def _handle_join(self, data):
        user_id = data.get("user_id")
        username = data.get("username")
        conv_id = data.get("conversation_id")

        if user_id and username:
            self.user_id = user_id
            status = await self._get_user_status(user_id)
            online_users[user_id] = {"username": username, "status": status}
            await self.channel_layer.group_add("presence", self.channel_name)
            await self.channel_layer.group_send(
                "presence",
                {"type": "presence.update", "users": _online_list()},
            )

        if conv_id:
            room = f"conv_{conv_id}"
            self.rooms.add(room)
            await self.channel_layer.group_add(room, self.channel_name)

    async def _handle_leave(self, data):
        conv_id = data.get("conversation_id")
        if conv_id:
            room = f"conv_{conv_id}"
            self.rooms.discard(room)
            await self.channel_layer.group_discard(room, self.channel_name)

    async def _handle_typing(self, data):
        conv_id = data.get("conversation_id")
        if conv_id:
            await self.channel_layer.group_send(
                f"conv_{conv_id}",
                {"type": "chat.typing", "data": data, "sender": self.channel_name},
            )

    async def _handle_stop_typing(self, data):
        conv_id = data.get("conversation_id")
        if conv_id:
            await self.channel_layer.group_send(
                f"conv_{conv_id}",
                {"type": "chat.stop_typing", "data": data, "sender": self.channel_name},
            )

    # --- Group message handlers ---

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({"type": "online_users", "users": event["users"]}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "new_message", **event["data"]}))

    async def chat_message_updated(self, event):
        await self.send(text_data=json.dumps({"type": "message_updated", **event["data"]}))

    async def chat_message_deleted(self, event):
        await self.send(text_data=json.dumps({"type": "message_deleted", **event["data"]}))

    async def chat_typing(self, event):
        if self.channel_name != event.get("sender"):
            await self.send(text_data=json.dumps({"type": "user_typing", **event["data"]}))

    async def chat_stop_typing(self, event):
        if self.channel_name != event.get("sender"):
            await self.send(text_data=json.dumps({"type": "user_stop_typing", **event["data"]}))

    @database_sync_to_async
    def _get_user_status(self, user_id):
        from tone.models import User
        try:
            return User.objects.get(id=user_id).status or ""
        except User.DoesNotExist:
            return ""


def _online_list():
    return [{"id": uid, "username": info["username"], "status": info.get("status", "")}
            for uid, info in online_users.items()]
