import { Readable } from 'stream';

export async function readJSONStream(
  stream: Readable,
  onProgress: (chunk: any) => void,
  onDone?: () => void
): Promise<void> {
  let buffer = '';
  let doneCalled = false;

  await new Promise((resolve) => {
    stream.on('data', (data: Buffer) => {
      buffer += data.toString();

      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const rawData = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);

        if (rawData === '[DONE]') {
          if (!doneCalled) {
            onDone && onDone();
            resolve(1);
            doneCalled = true;
          }
          return;
        }

        if (!rawData.startsWith('data: ') || rawData.startsWith(':')) continue;

        try {
          const data = rawData.slice('data: '.length);
          if (data === '[DONE]') {
            if (!doneCalled) {
              onDone && onDone();
              resolve(1);
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
          onProgress(jsonData);
        } catch (error) {
          console.error('Error handling SSE stream forwarding', error);
        }
      }
    });

    stream.on('end', () => {
      if (buffer.length > 0) {
        if (!buffer.startsWith('data: ') || buffer.startsWith(':'))
          return;
        
        if (buffer.indexOf('data: [DONE]') >= 0) {
          if (!doneCalled) {
            onDone && onDone();
            resolve(1);
            doneCalled = true;
          }
          return;
        }

        try {
          const jsonData = JSON.parse(buffer.slice('data: '.length));
          onProgress(jsonData);
        } catch (error) {
          console.error('Error parsing SSE stream, chunk:', buffer);
        }
      }

      if (!doneCalled) {
        onDone && onDone();
        resolve(1);
        doneCalled = true;
      }
    });
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