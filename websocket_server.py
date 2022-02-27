import asyncio
import datetime
import random
import websockets


async def time(websocket, path):
    while True:
        now = datetime.datetime.utcnow().isoformat() + "Z"
        await websocket.send(now)
        print(f"Sent {now}, sleeping...")
        await asyncio.sleep(random.random() * 3)


async def somethingelse():
    while True:
        print("something else! Sleeping...")
        await asyncio.sleep(0)


start_server = websockets.serve(time, "127.0.0.1", 5678)

loop = asyncio.get_event_loop()
loop.run_until_complete(start_server)
loop.run_until_complete(somethingelse())
loop.run_forever()
