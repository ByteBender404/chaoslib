import uvicorn
from fastapi import FastAPI

app = FastAPI()

class MyMiddleware:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        s = send
        visited = set()
        while True:
            if hasattr(s, '__self__'):
                if hasattr(s.__self__, 'transport'):
                    print("SETTING response_started = True and CLOSING!")
                    s.__self__.response_started = True
                    s.__self__.transport.close()
                    return
            
            if hasattr(s, '__closure__') and s.__closure__:
                found = False
                for cell in s.__closure__:
                    if callable(cell.cell_contents) and id(cell.cell_contents) not in visited:
                        visited.add(id(cell.cell_contents))
                        s = cell.cell_contents
                        found = True
                        break
                if found: continue
            break
        print("FAILED TO FIND")
        await self.app(scope, receive, send)

app.add_middleware(MyMiddleware)

@app.get("/")
def root():
    return {}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8002)
