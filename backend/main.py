from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from googleapiclient.discovery import build
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

YOUTUBE_API_KEY = "AIzaSyD8yVCj8qoB_VFtRuzL6ICP4UXgGzlJrJc"
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.social_tracker

@app.get("/api/youtube/{channel_id}")
async def get_youtube_stats(channel_id: str):
    try:
        request = youtube.channels().list(
            part="statistics,snippet",
            id=channel_id
        )
        response = request.execute()
        
        if not response.get('items'):
            return {"error": "Channel not found"}

        item = response['items'][0]
        stats = item['statistics']
        snippet = item['snippet']
        new_sub_count = int(stats['subscriberCount'])
        
        live_data = {
            "title": snippet['title'],
            "subscribers": new_sub_count,
            "views": stats['viewCount'],
            "videos": stats['videoCount']
        }

        # OPTIMIZATION: Only save to DB if data has changed (Saves CPU/Disk)
        last_entry = await db.stats_history.find_one(
            {"channel_id": channel_id}, 
            sort=[("timestamp", -1)]
        )

        if not last_entry or last_entry["subscribers"] != new_sub_count:
            await db.stats_history.insert_one({
                "channel_id": channel_id,
                "subscribers": new_sub_count,
                "timestamp": datetime.utcnow()
            })
        
        return live_data

    except Exception as e:
        return {"error": str(e)}

@app.get("/api/history/{channel_id}")
async def get_history(channel_id: str):
    # Reduced limit to 10 for lighter rendering
    cursor = db.stats_history.find({"channel_id": channel_id}).sort("timestamp", -1).limit(10)
    history = await cursor.to_list(length=10)
    return [{"subscribers": h["subscribers"], "timestamp": h["timestamp"].isoformat()} for h in history][::-1]

if __name__ == "__main__":
    # Note: Use reload=False in a fixed environment to save more CPU
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)