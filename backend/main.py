from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from googleapiclient.discovery import build
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uvicorn

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Configuration
YOUTUBE_API_KEY = "YOUR_API_KEY"
MONGO_URL = "mongodb://localhost:27017"
IST = timezone(timedelta(hours=5, minutes=30)) # Offset for India Standard Time

# Clients
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
client = AsyncIOMotorClient(MONGO_URL)
db = client.social_tracker

@app.get("/api/youtube/{channel_id}")
async def get_youtube_stats(channel_id: str):
    try:
        request = youtube.channels().list(part="statistics,snippet", id=channel_id)
        response = request.execute()
        if not response.get('items'): return {"error": "Channel not found"}

        item = response['items'][0]
        stats = item['statistics']
        new_count = int(stats['subscriberCount'])

        # THERMAL OPTIMIZATION: Only save if data changed
        last = await db.stats_history.find_one({"channel_id": channel_id}, sort=[("timestamp", -1)])
        
        if not last or last["subscribers"] != new_count:
            await db.stats_history.insert_one({
                "channel_id": channel_id,
                "subscribers": new_count,
                "timestamp": datetime.now(IST) # Save in IST for correct chart time
            })
        
        return {
            "title": item['snippet']['title'],
            "subscribers": new_count,
            "views": stats['viewCount'],
            "videos": stats['videoCount']
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/history/{channel_id}")
async def get_history(channel_id: str):
    # Fetch 15 points for a smoother chart
    cursor = db.stats_history.find({"channel_id": channel_id}).sort("timestamp", -1).limit(15)
    history = await cursor.to_list(length=15)
    # Reverse to show chronological order (left to right)
    return [{"subscribers": h["subscribers"], "timestamp": h["timestamp"].isoformat()} for h in history][::-1]

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
