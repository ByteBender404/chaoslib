import socket
def wsgi_app(environ, start_response):
    sock = environ.get('werkzeug.socket')
    if sock:
        try:
            sock.shutdown(socket.SHUT_RDWR)
        except Exception:
            pass
        sock.close()
    return []

if __name__ == "__main__":
    from werkzeug.serving import run_simple
    run_simple("127.0.0.1", 8003, wsgi_app)
