const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const net = require('net')

const PORT = Number(process.env.WS_PORT || 5175)
const CERT_DIR = path.join(__dirname, '..', 'certs')
const certPath = path.join(CERT_DIR, 'petshop-localhost.crt')
const keyPath = path.join(CERT_DIR, 'petshop-localhost-key.pem')

const clients = new Set()

function encodeFrame(payload) {
  const data = Buffer.from(payload)
  if (data.length < 126) return Buffer.concat([Buffer.from([0x81, data.length]), data])
  if (data.length < 65536) {
    const head = Buffer.alloc(4)
    head[0] = 0x81
    head[1] = 126
    head.writeUInt16BE(data.length, 2)
    return Buffer.concat([head, data])
  }
  const head = Buffer.alloc(10)
  head[0] = 0x81
  head[1] = 127
  head.writeBigUInt64BE(BigInt(data.length), 2)
  return Buffer.concat([head, data])
}

function broadcast(message, sender) {
  const frame = encodeFrame(JSON.stringify(message))
  for (const client of clients) {
    if (client !== sender && !client.destroyed) client.write(frame)
  }
}

function handshake(socket, request) {
  const key = request.match(/Sec-WebSocket-Key:\s*(.+)/i)?.[1]?.trim()
  if (!key) return socket.destroy()
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n')
  clients.add(socket)
  socket.on('close', () => clients.delete(socket))
  socket.on('error', () => clients.delete(socket))
  socket.on('data', (buffer) => handleFrame(socket, buffer))
}

function handleFrame(socket, buffer) {
  let offset = 0
  while (offset + 2 <= buffer.length) {
    const first = buffer[offset]
    const second = buffer[offset + 1]
    const opcode = first & 0x0f
    const masked = Boolean(second & 0x80)
    let length = second & 0x7f
    offset += 2
    if (length === 126) { if (offset + 2 > buffer.length) return; length = buffer.readUInt16BE(offset); offset += 2 }
    else if (length === 127) { if (offset + 8 > buffer.length) return; length = Number(buffer.readBigUInt64BE(offset)); offset += 8 }
    const mask = masked ? buffer.subarray(offset, offset + 4) : null
    if (masked) offset += 4
    if (offset + length > buffer.length) return
    const payload = Buffer.from(buffer.subarray(offset, offset + length))
    offset += length
    if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4]
    if (opcode === 0x8) return socket.end()
    if (opcode === 0x9) { socket.write(Buffer.from([0x8a, 0])); continue }
    if (opcode === 0x1) {
      try {
        const message = JSON.parse(payload.toString())
        if (message?.type === 'notification' && message.notification) broadcast(message, socket)
      } catch {}
    }
  }
}

function startServer() {
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('ไม่พบ certificate. รัน .\\https-dev.ps1 ก่อน')
    process.exit(1)
  }
  const server = require('https').createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) })
  server.on('upgrade', (request, socket) => handshake(socket, request))
  server.listen(PORT, '0.0.0.0', () => console.log(`PetShop WSS server: wss://0.0.0.0:${PORT}`))
}

startServer()
