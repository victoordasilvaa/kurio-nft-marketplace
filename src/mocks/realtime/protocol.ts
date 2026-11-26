import { Decoder, type Packet, PacketType } from 'socket.io-parser';

// Frames brutos do Engine.IO v4 / Socket.IO v5 que o binding 0.2.0 não expõe.
// Protocolos: https://socket.io/docs/v4/engine-io-protocol/ e /socket-io-protocol/

// tipo do pacote Engine.IO é o primeiro caractere do frame
export const ENGINE_IO_PING = '2';
export const ENGINE_IO_PONG = '3';
const ENGINE_IO_MESSAGE = '4';

const DEFAULT_NAMESPACE = '/';

export interface ClientConnectPacket {
  auth: unknown;
}

// Lê o CONNECT do Socket.IO enviado pelo cliente ao namespace padrão ("40" + auth em JSON).
// O binding só repassa pacotes EVENT, então o auth precisa ser lido do frame bruto.
export function readClientConnect(frame: string): ClientConnectPacket | null {
  if (!frame.startsWith(ENGINE_IO_MESSAGE)) return null;

  const packets: Packet[] = [];
  const decoder = new Decoder();
  decoder.on('decoded', (packet: Packet) => {
    packets.push(packet);
  });
  try {
    decoder.add(frame.slice(ENGINE_IO_MESSAGE.length));
  } catch {
    // frame malformado não é um CONNECT válido
    return null;
  } finally {
    decoder.destroy();
  }

  const connect = packets.find(
    (packet) => packet.type === PacketType.CONNECT && packet.nsp === DEFAULT_NAMESPACE,
  );
  if (!connect) return null;
  const auth: unknown = connect.data;
  return { auth: auth ?? {} };
}

// CONNECT_ERROR ("44") recusa a conexão no namespace padrão; o cliente emite connect_error
// e não tenta reconectar sozinho
export function encodeConnectError(
  message: string,
  data?: Readonly<Record<string, string>>,
): string {
  const payload = data === undefined ? { message } : { message, data };
  return `${ENGINE_IO_MESSAGE}${PacketType.CONNECT_ERROR}${JSON.stringify(payload)}`;
}
