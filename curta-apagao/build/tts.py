import asyncio, ssl, json, hashlib, os, subprocess
import edge_tts, edge_tts.communicate as ec
ec._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
from roteiro import EVENTS, VOICES
os.makedirs("voz", exist_ok=True)
async def gen(lid, who, text):
    v = VOICES[who]
    key = hashlib.md5(json.dumps([v, text]).encode()).hexdigest()[:10]
    mp3, js = f"voz/{lid}.mp3", f"voz/{lid}.json"
    if os.path.exists(js) and json.load(open(js)).get("key")==key: return
    for attempt in range(4):
        try:
            c = edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"], boundary="WordBoundary")
            words=[]; audio=b""
            async for ch in c.stream():
                if ch["type"]=="audio": audio+=ch["data"]
                elif ch["type"]=="WordBoundary": words.append([ch["text"], ch["offset"]/1e7, (ch["offset"]+ch["duration"])/1e7])
            open(mp3,"wb").write(audio)
            dur=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",mp3]))
            json.dump(dict(key=key, words=words, dur=dur), open(js,"w"), ensure_ascii=False)
            print(lid, round(dur,2)); return
        except Exception as e:
            print("retry", lid, e); await asyncio.sleep(2*(attempt+1))
    raise SystemExit("fail "+lid)
async def main():
    sem = asyncio.Semaphore(4)
    async def one(e):
        async with sem: await gen(e[1], e[2], e[3])
    await asyncio.gather(*[one(e) for e in EVENTS if e[0]=="say"])
asyncio.run(main())
