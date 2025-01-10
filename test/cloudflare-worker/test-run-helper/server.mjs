import * as http from "http";
import * as https from "https";
import { URL } from "url";

const proxyPort = parseInt(process.argv[2] || 9060);
const cachePort = proxyPort + 1;

const cache = {};

/* A simple proxy server to work around HTTPS issues with workerd. */
http.createServer((req, res) => {
  let index = req.url.indexOf("/", 1);
  if (index < 0) index = req.url.length;
  let originalUrl = decodeURIComponent(req.url.substring(1, index));
  if (!originalUrl.startsWith("http:") && !originalUrl.startsWith("https:")) {
    res.writeHead(404);
    res.end();
    return;
  }
  originalUrl += req.url.substring(index);
  console.log(`[PROXY] ${req.method} ${req.url} -> ${originalUrl}`);

  const { protocol, hostname, pathname, search } = new URL(originalUrl);
  const serverReqOptions = {
    method: req.method,
    protocol,
    hostname,
    path: pathname + search,
    headers: { ...req.headers, "host": hostname },
  };

  const isHTTPS = protocol.toLowerCase() === "https:";
  const proxy = (isHTTPS ? https : http).request(serverReqOptions, serverRes => {
    res.writeHead(serverRes.statusCode, serverRes.headers);
    serverRes.pipe(res, {
      end: true,
    });
  });

  req.pipe(proxy, {
    end: true,
  });
}).listen(proxyPort);

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

console.log(`Proxy server is listening at http://localhost:${proxyPort}...`);
console.log(`Fake Cloudflare Cache API server is listening at http://localhost:${cachePort}...`);
