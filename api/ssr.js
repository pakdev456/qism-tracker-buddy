import serverModule from "../dist/server/server.js";

const server = serverModule.default ?? serverModule;

export default async function handler(req, res) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "localhost";
  const url = new URL(req.url ?? "", `${protocol}://${host}`);
  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? null : req,
  });

  const response = await server.fetch(request, undefined, undefined);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });

  const body = response.body ? Buffer.from(await response.arrayBuffer()) : null;
  res.end(body);
}
