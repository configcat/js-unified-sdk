import * as http from "http";

const cachePort = parseInt(process.argv[2] || 9061);

const cache = {};

/* A fake Cloudflare Cache API server. */
http.createServer((req, res) => {
  console.log(`[CACHE] ${req.method} ${req.url}`);

  const key = req.url;

  if (req.method === "GET") {
    const message = cache[key];
    if (message != null && res.socket) {
      let index = message.indexOf("\r\n");
      index = index >= 0 ? index + 2 : message.length;
      res.socket.write("HTTP/1.1 200 OK\r\n");
      res.socket.write("CF-Cache-Status: HIT\r\n");
      res.socket.write(message.substring(index));
      res.socket.end();
    } else {
      res.writeHead(200, { "CF-Cache-Status": "MISS" });
    }
    res.end();
  } else if (req.method === "PUT") {
    let message = "";
    req.on("data", chunk => {
      message += chunk;
    });

    req.on("end", () => {
      cache[key] = message;
      res.writeHead(204);
      res.end();
    });
  }
}).listen(cachePort);

console.log(`Fake Cloudflare Cache API server is listening at http://localhost:${cachePort}...`);
