from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from dotenv import load_dotenv

from api.listing import handler


ROOT = Path(__file__).resolve().parent


class LocalHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/listing":
            self.send_error(404)
            return
        handler.do_POST(self)

    reply = handler.reply


if __name__ == "__main__":
    load_dotenv(ROOT / ".env", encoding="utf-8-sig")
    server_handler = partial(LocalHandler, directory=ROOT / "public")
    with ThreadingHTTPServer(("127.0.0.1", 8765), server_handler) as server:
        print("http://127.0.0.1:8765", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
