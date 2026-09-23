from typing import Dict, List, Any
from fastapi import WebSocket
import logging

logger = logging.getLogger("agri_backend.websockets")

class ConnectionManager:
    def __init__(self):
        # Maps farm_id to a list of active websocket connections for that farm
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, farm_id: str):
        await websocket.accept()
        if farm_id not in self.active_connections:
            self.active_connections[farm_id] = []
        self.active_connections[farm_id].append(websocket)
        logger.info(f"WebSocket connected for farm {farm_id}. Total connections for farm: {len(self.active_connections[farm_id])}")

    def disconnect(self, websocket: WebSocket, farm_id: str):
        if farm_id in self.active_connections:
            if websocket in self.active_connections[farm_id]:
                self.active_connections[farm_id].remove(websocket)
            if not self.active_connections[farm_id]:
                del self.active_connections[farm_id]
        logger.info(f"WebSocket disconnected for farm {farm_id}.")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        logger.info(f"Broadcasting message to {len(self.active_connections)} active farms")
        for farm_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to farm {farm_id}: {e}")

# Global instance
manager = ConnectionManager()
