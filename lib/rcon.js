// lib/rcon.js - Eksekusi command di Minecraft server via RCON

/**
 * RCON Protocol Implementation untuk Node.js
 * Mengirim command ke Minecraft server setelah pembayaran berhasil
 */

import net from 'net';

const PACKET_TYPE = {
  COMMAND: 2,
  AUTH: 3,
  RESPONSE: 0,
  AUTH_RESPONSE: 2,
};

function createPacket(id, type, body) {
  const bodyBuffer = Buffer.from(body + '\0', 'utf8');
  const buffer = Buffer.alloc(14 + bodyBuffer.length);
  buffer.writeInt32LE(10 + bodyBuffer.length, 0); // size
  buffer.writeInt32LE(id, 4);                      // id
  buffer.writeInt32LE(type, 8);                    // type
  bodyBuffer.copy(buffer, 12);
  buffer.writeInt8(0, buffer.length - 1);
  return buffer;
}

export async function executeRCON(command) {
  return new Promise((resolve, reject) => {
    const host = process.env.RCON_HOST;
    const port = parseInt(process.env.RCON_PORT || '25575');
    const password = process.env.RCON_PASSWORD;

    if (!host || !password) {
      console.warn('⚠️ RCON tidak dikonfigurasi, command tidak dikirim:', command);
      return resolve({ success: false, reason: 'RCON not configured' });
    }

    const socket = new net.Socket();
    let authenticated = false;
    let responseData = Buffer.alloc(0);

    socket.setTimeout(10000);

    socket.connect(port, host, () => {
      socket.write(createPacket(1, PACKET_TYPE.AUTH, password));
    });

    socket.on('data', (data) => {
      responseData = Buffer.concat([responseData, data]);

      while (responseData.length >= 12) {
        const size = responseData.readInt32LE(0) + 4;
        if (responseData.length < size) break;

        const id = responseData.readInt32LE(4);
        const type = responseData.readInt32LE(8);
        const body = responseData.slice(12, size - 2).toString('utf8');

        responseData = responseData.slice(size);

        if (!authenticated) {
          if (id === -1) {
            socket.destroy();
            reject(new Error('RCON: Auth gagal, password salah'));
            return;
          }
          authenticated = true;
          // Kirim command setelah auth berhasil
          socket.write(createPacket(2, PACKET_TYPE.COMMAND, command));
        } else {
          socket.destroy();
          resolve({ success: true, response: body });
        }
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('RCON: Connection timeout'));
    });

    socket.on('error', (err) => {
      reject(new Error('RCON error: ' + err.message));
    });
  });
}

/**
 * Eksekusi multiple commands untuk satu order
 * Command bisa berisi placeholder {username} yang akan diganti nama player
 */
export async function executeOrderCommands(commands, username) {
  const results = [];
  
  for (const cmd of commands) {
    const resolvedCmd = cmd.replace(/{username}/gi, username).replace(/{player}/gi, username);
    try {
      const result = await executeRCON(resolvedCmd);
      results.push({ command: resolvedCmd, ...result });
      // Delay kecil antar command
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      results.push({ command: resolvedCmd, success: false, error: error.message });
    }
  }

  return results;
}
