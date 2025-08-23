// Simple Content-Length JSON-RPC framing adapter for Node.js
// Intended as a starting implementation for MCP Guarda to interoperate with real MCP clients

const { Transform } = require('stream');

// Read Content-Length framed messages from a stream and emit parsed JSON objects.
class ContentLengthParser extends Transform {
  constructor(options = {}) {
    super({ readableObjectMode: true });
    this._buffer = Buffer.alloc(0);
    this._expected = null;
  }

  _transform(chunk, enc, cb) {
    try {
      this._buffer = Buffer.concat([this._buffer, Buffer.from(chunk)]);

      while (true) {
        if (this._expected === null) {
          // try to parse header
          const idx = this._buffer.indexOf('\r\n\r\n');
          if (idx === -1) break; // wait for full header

          const header = this._buffer.slice(0, idx).toString('utf8');
          const m = header.match(/Content-Length:\s*(\d+)/i);
          if (!m) {
            // no Content-Length; drop or error
            return cb(new Error('Missing Content-Length header'));
          }
          this._expected = parseInt(m[1], 10);
          // consume header + separator
          this._buffer = this._buffer.slice(idx + 4);
        }

        if (this._buffer.length < this._expected) break; // wait for full body

        const body = this._buffer.slice(0, this._expected).toString('utf8');
        this._buffer = this._buffer.slice(this._expected);
        this._expected = null;

        try {
          const obj = JSON.parse(body);
          this.push(obj);
        } catch (err) {
          return cb(new Error('Invalid JSON body'));
        }
      }
      cb();
    } catch (err) { cb(err); }
  }
}

// Write JSON-RPC object to a stream with Content-Length framing
function writeFramed(stream, obj) {
  const body = JSON.stringify(obj);
  const header = `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n`;
  stream.write(header + body);
}

module.exports = { ContentLengthParser, writeFramed };

// Example usage (standalone adapter):
// const { spawn } = require('child_process');
// const { ContentLengthParser, writeFramed } = require('./content_length_adapter');
// 
// // Proxy between a stdin/stdout framed client and an NDJSON-based guard-inspector
// const parser = new ContentLengthParser();
// process.stdin.pipe(parser);
// parser.on('data', obj => {
//   // intercept/inspect obj here, then forward to guard core (NDJSON, websocket, etc.)
//   // after receiving response, call writeFramed(process.stdout, responseObj)
//   console.error('Got framed request:', obj);
// });
// 
// Note: This is a small, synchronous parser. For production, add streaming zero-copy, backpressure handling, and defensive limits (max message size).