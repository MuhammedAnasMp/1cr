export default class CanvasRoom {
  room: any;
  constructor(room: any) {
    this.room = room;
  }

  onConnect(conn: any, ctx: any) {
    const connectionsCount = [...this.room.getConnections()].length;
    this.room.broadcast(
      JSON.stringify({
        type: 'presence',
        viewers: Math.max(1, connectionsCount),
        sessions: connectionsCount,
      })
    );
  }

  onClose(conn: any) {
    const connectionsCount = [...this.room.getConnections()].length;
    this.room.broadcast(
      JSON.stringify({
        type: 'presence',
        viewers: Math.max(1, connectionsCount),
        sessions: connectionsCount,
      })
    );
  }

  onMessage(message: string, sender: any) {
    try {
      this.room.broadcast(message, [sender.id]);
    } catch (e) {}
  }
}
