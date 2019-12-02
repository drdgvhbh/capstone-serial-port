import SerialPort from 'serialport';
import Denque from 'denque';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const serialPortName = process.env.SERIAL_PORT;
if (!serialPortName) {
  throw new Error('ENV variable SERIAL_PORT is not defined');
}
const wsProt = process.env.WS_PROT;
const wsHost = process.env.WS_HOST;
const wsPort = process.env.WS_PORT;

if (!wsProt || !wsHost || !wsPort) {
  throw new Error('ENV variables missing');
}

const ws = new WebSocket(`${wsProt}://${wsHost}:${wsPort}`);

const serialPort = new SerialPort(serialPortName!, function(err) {
  if (err) {
    console.error('Error: ', err.message);
    process.exit(1);
  }
});

const deque = new Denque<number>([]);

serialPort.on('readable', function() {
  const data = serialPort.read();
  if (data && data.toString().trim()) {
    const distance = +data.toString().trim();
    if (isNaN(distance)) {
      return;
    }
    deque.push(distance);
    if (deque.length > 5) {
      deque.shift();
    }

    const avgDist = Math.max(...deque.toArray());
    ws.send(avgDist);
    console.log(distance, 'avg:', avgDist);
  }
});

serialPort.on('error', (err) => {
  console.error('Error', err);
});
