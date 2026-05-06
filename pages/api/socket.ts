import type { NextApiRequest, NextApiResponse } from "next"
import type { Server as HTTPServer } from "http"
import { ensureSocketServer } from "@/lib/socket-server"

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse & {
    socket?: { server?: HTTPServer & { io?: unknown } }
  },
) {
  if (!res.socket?.server?.io) {
    const server = res.socket?.server as HTTPServer
    if (server) {
      await ensureSocketServer(server)
    }
  }

  res.end()
}
