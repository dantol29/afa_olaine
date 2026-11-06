// Minimal SMTP server for local development: accepts every message on a
// loopback address and prints it to the terminal instead of delivering it.
// Dependency-free on purpose so production installs stay unchanged.
import net from "node:net";

const CRLF = "\r\n";
const DATA_TERMINATOR = `${CRLF}.${CRLF}`;

function decodeQuotedPrintable(value) {
  const bytes = [];
  const text = value.replace(/=\r?\n/g, "");
  for (let index = 0; index < text.length; index++) {
    const hex = text.slice(index + 1, index + 3);
    if (text[index] === "=" && /^[0-9A-F]{2}$/i.test(hex)) {
      bytes.push(parseInt(hex, 16));
      index += 2;
    } else {
      bytes.push(...Buffer.from(text[index], "utf8"));
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

/** Decodes RFC 2047 encoded words such as =?UTF-8?Q?...?= in headers. */
function decodeHeaderValue(value) {
  return value
    .replace(/\?=\s+=\?/g, "?==?")
    .replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_match, _charset, encoding, text) =>
      encoding.toUpperCase() === "B"
        ? Buffer.from(text, "base64").toString("utf8")
        : decodeQuotedPrintable(text.replace(/_/g, " ")),
    );
}

function parseMessage(raw) {
  const separatorIndex = raw.indexOf(`${CRLF}${CRLF}`);
  const headerText = separatorIndex === -1 ? raw : raw.slice(0, separatorIndex);
  const body = separatorIndex === -1 ? "" : raw.slice(separatorIndex + CRLF.length * 2);
  const headers = new Map();
  for (const line of headerText.replace(/\r\n[ \t]+/g, " ").split(CRLF)) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      headers.set(line.slice(0, colonIndex).trim().toLowerCase(), line.slice(colonIndex + 1).trim());
    }
  }

  const encoding = (headers.get("content-transfer-encoding") ?? "").toLowerCase();
  const isMultipart = (headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/");
  let text = body;
  if (!isMultipart && encoding === "quoted-printable") text = decodeQuotedPrintable(body);
  if (!isMultipart && encoding === "base64") text = Buffer.from(body, "base64").toString("utf8");

  return {
    from: decodeHeaderValue(headers.get("from") ?? ""),
    to: decodeHeaderValue(headers.get("to") ?? ""),
    subject: decodeHeaderValue(headers.get("subject") ?? ""),
    text: text.replace(/\r\n/g, "\n").replace(/^\.\./gm, "."),
  };
}

function printMessage(message, envelopeRecipients) {
  const line = "─".repeat(72);
  console.log(
    [
      "",
      `\x1b[36m${line}`,
      `✉  LOCAL MAIL SINK — not delivered, ${new Date().toLocaleString("lv-LV")}`,
      `${line}\x1b[0m`,
      `From:    ${message.from}`,
      `To:      ${message.to || envelopeRecipients.join(", ")}`,
      `Subject: ${message.subject}`,
      "",
      message.text.trimEnd(),
      `\x1b[36m${line}\x1b[0m`,
      "",
    ].join("\n"),
  );
}

function handleConnection(socket) {
  let buffer = "";
  let inData = false;
  let awaitingAuthLines = 0;
  let recipients = [];
  const reply = (line) => socket.write(`${line}${CRLF}`);

  reply("220 afa-olaine-local-mail-sink ESMTP");
  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    while (buffer.length) {
      if (inData) {
        const end = buffer.indexOf(DATA_TERMINATOR);
        if (end === -1) return;
        printMessage(parseMessage(buffer.slice(0, end)), recipients);
        buffer = buffer.slice(end + DATA_TERMINATOR.length);
        inData = false;
        recipients = [];
        reply("250 OK: printed, not delivered");
        continue;
      }

      const lineEnd = buffer.indexOf(CRLF);
      if (lineEnd === -1) return;
      const line = buffer.slice(0, lineEnd);
      buffer = buffer.slice(lineEnd + CRLF.length);
      if (awaitingAuthLines > 0) {
        awaitingAuthLines--;
        reply(awaitingAuthLines > 0 ? "334 UGFzc3dvcmQ6" : "235 Authentication accepted");
        continue;
      }

      const command = line.slice(0, 4).toUpperCase();
      if (command === "EHLO") {
        reply("250-afa-olaine-local-mail-sink");
        reply("250-AUTH PLAIN LOGIN");
        reply("250 8BITMIME");
      } else if (command === "HELO") {
        reply("250 afa-olaine-local-mail-sink");
      } else if (command === "AUTH") {
        const [, mechanism, initialResponse] = line.split(" ");
        if (mechanism?.toUpperCase() === "LOGIN") {
          awaitingAuthLines = initialResponse ? 1 : 2;
          reply(initialResponse ? "334 UGFzc3dvcmQ6" : "334 VXNlcm5hbWU6");
        } else if (initialResponse) {
          reply("235 Authentication accepted");
        } else {
          awaitingAuthLines = 1;
          reply("334 ");
        }
      } else if (command === "RCPT") {
        recipients.push(line.replace(/^RCPT TO:\s*/i, "").replace(/[<>]/g, ""));
        reply("250 OK");
      } else if (command === "DATA") {
        inData = true;
        reply("354 End data with <CR><LF>.<CR><LF>");
      } else if (command === "QUIT") {
        reply("221 Bye");
        socket.end();
        return;
      } else {
        // MAIL, RSET, NOOP and anything else are simply acknowledged.
        reply("250 OK");
      }
    }
  });
  socket.on("error", () => socket.destroy());
}

export function startMailSink({ host, port }) {
  return new Promise((resolve, reject) => {
    const server = net.createServer(handleConnection);
    server.once("error", reject);
    server.listen(port, host, () => {
      console.log(`Local mail sink listening on ${host}:${port} — emails are printed here, never delivered.`);
      resolve(server);
    });
  });
}
