import { createReadStream, stat } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 5173);
const host = "127.0.0.1";
const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, "public");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(request.url.split("?")[0]);
  const candidates =
    pathname === "/"
      ? [path.join(root, "index.html")]
      : [path.join(publicRoot, pathname), path.join(root, pathname)];

  const sendFile = (filePath) => {
    stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        const nextPath = candidates.shift();
        if (nextPath) {
          sendFile(nextPath);
          return;
        }

        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      });
      createReadStream(filePath).pipe(response);
    });
  };

  sendFile(candidates.shift());
}).listen(port, host, () => {
  console.log(`POSED site running at http://${host}:${port}`);
});
