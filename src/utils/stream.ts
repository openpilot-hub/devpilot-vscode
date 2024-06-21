import { Readable } from 'stream';

export type StreamHandler = {
  onProgress: (chunk: any) => void,
  onDone?: () => void,
  onInterrupted?: () => void,
  onError?: (err: Error) => void,
  interrupt?: () => void
}

export function readJSONStream(stream: Readable, handler: StreamHandler): void {
  let buffer = '';
  let doneCalled = false;
  let interrupted = false;

  // Function to handle interruption
  handler.interrupt = () => {
    interrupted = true;
    stream.removeAllListeners('data');
    stream.removeAllListeners('end');
    stream.destroy(); // This ensures no more events will be emitted
    handler.onInterrupted?.();
  };

  stream.on('data', (data: Buffer) => {
    if (interrupted) return; // Exit if the stream has been marked as interrupted

    buffer += data.toString();

    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
      const rawData = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (rawData === '[DONE]') {
        if (!doneCalled) {
          handler.onDone?.();
          doneCalled = true;
        }
        return;
      }

      if (!rawData.startsWith('data: ') || rawData.startsWith(':')) continue;

      try {
        const data = rawData.slice('data: '.length);
        if (data === '[DONE]') {
          if (!doneCalled) {
            handler.onDone?.();
            doneCalled = true;
          }
          return;
        }
        let jsonData = '';
        try {
          jsonData = JSON.parse(data);
        } catch (error) {
          console.error('Error parsing SSE stream, chunk:', rawData);
        }
        handler.onProgress(jsonData);
      } catch (error) {
        console.error('Error handling SSE stream forwarding', error);
      }
    }
  });

  stream.on('end', () => {
    if (interrupted) return; // Exit if the stream has been marked as interrupted

    if (buffer.length > 0) {
      if (!buffer.startsWith('data: ') || buffer.startsWith(':'))
        return;

      try {
        const jsonData = JSON.parse(buffer.slice('data: '.length));
        handler.onProgress(jsonData);
      } catch (error) {
        console.error('Error parsing SSE stream, chunk:', buffer);
      }
    }

    if (!doneCalled) {
      doneCalled = true;
      handler.onDone?.();
    }
  });

  // Handle possible errors on the stream
  stream.on('error', (err) => {
    handler.onError?.(err);
  });
}

export async function readStream(stream: Readable, onProgress: (chunk: string) => void, onDone: () => void) {
  await new Promise((resolve) => {
    stream.on('data', (buf: Buffer) => {
      buf.toString().split('\n\n').forEach(bl => {
        let chunk = bl.replace('data: ', '');
        if (chunk.trim() === '')
          return;
        if (chunk.indexOf('[DONE]') >= 0) {
          onDone();
          resolve(1);
          return;
        }
        onProgress(chunk);
      })
    })
    stream.on('end', () => {
      onDone();
      resolve(1)
    });
  });
}