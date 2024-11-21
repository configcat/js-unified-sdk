import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import * as url from "url";

const rootDir = process.argv[2] || ".";
const port = process.argv[3] || 3000;

http.createServer(function (req, res) {
  console.log(`${req.method} ${req.url}`);

  const parsedUrl = url.parse(req.url);
  let filePath = path.join(rootDir, parsedUrl.pathname);
  let ext = path.parse(filePath).ext;
  const map = {
    ".ico": "image/x-icon",
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".doc": "application/msword"
  };

  fs.exists(filePath, function (exist) {
    if (!exist) {
      res.statusCode = 404;
      res.end(`File ${filePath} not found!`);
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      ext = ".html";
      filePath = path.join(filePath, "index" + ext);
    }

    fs.readFile(filePath, function(err, data) {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      }
      else {
        res.setHeader("Content-type", map[ext] || "text/plain" );
        res.end(data);
      }
    });
  });
}).listen(parseInt(port));

console.log(`Server listening at http://localhost:${port}...`);