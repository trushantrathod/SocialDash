import os
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from googleapiclient.discovery import build
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone, timedelta
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from textblob import TextBlob
import re
import uvicorn
import math

# Automatically look for the .env file in parent directories
load_dotenv(find_dotenv())

app = FastAPI()

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Fetch the API key from the environment variables
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

if not YOUTUBE_API_KEY:
    raise ValueError("YOUTUBE_API_KEY is not set in the .env file")

IST = timezone(timedelta(hours=5, minutes=30))

# --- FIREBASE ADMIN INITIALIZATION ---
try:
    import json

    firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

    if firebase_json:
        firebase_credentials = json.loads(firebase_json)
        cred = credentials.Certificate(firebase_credentials)
    else:
        # Local development only.
        # This file MUST remain in .gitignore.
        local_key = os.path.join(
            os.path.dirname(__file__),
            "serviceAccountKey.json"
        )

        if not os.path.exists(local_key):
            raise FileNotFoundError(
                "Firebase credentials not configured. "
                "Set FIREBASE_SERVICE_ACCOUNT_JSON."
            )

        cred = credentials.Certificate(local_key)

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    db = firestore.client()

except Exception as e:
    print(f"Error initializing Firebase Admin: {e}")
    db = None

youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

# --- ML HELPER FUNCTIONS ---
def clean_text(text):
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text.lower().strip()

def analyze_sentiment(comments):
    if not comments:
        return {"distribution": {"positive": 0, "neutral": 100, "negative": 0}, "score": 0.0}
    
    sentiments = {"positive": 0, "neutral": 0, "negative": 0}
    total_score = 0
    
    for c in comments:
        analysis = TextBlob(c['text'])
        score = analysis.sentiment.polarity
        total_score += score
        
        if score > 0.1: sentiments["positive"] += 1
        elif score < -0.1: sentiments["negative"] += 1
        else: sentiments["neutral"] += 1
            
    total = len(comments)
    return {
        "distribution": {
            "positive": round((sentiments["positive"]/total)*100),
            "neutral": round((sentiments["neutral"]/total)*100),
            "negative": round((sentiments["negative"]/total)*100)
        },
        "score": round(total_score / total, 2) if total > 0 else 0
    }

def perform_dbscan_clustering(comments):
    texts = [clean_text(c['text']) for c in comments if len(c['text']) > 5]
    if len(texts) < 5: return [], []

    vectorizer = TfidfVectorizer(stop_words='english', max_features=100)
    X = vectorizer.fit_transform(texts)
    
    dbscan = DBSCAN(eps=0.5, min_samples=2)
    labels = dbscan.fit_predict(X)
    
    df = pd.DataFrame({'text': texts, 'cluster': labels})
    clusters_info = []
    feature_names = vectorizer.get_feature_names_out()
    all_top_keywords = set()
    
    for cluster_id in set(labels):
        if cluster_id == -1: continue 
        
        cluster_texts = df[df['cluster'] == cluster_id]['text'].tolist()
        cluster_X = vectorizer.transform(cluster_texts)
        scores = np.asarray(cluster_X.mean(axis=0)).flatten()
        top_indices = scores.argsort()[::-1][:4]
        top_keywords = [feature_names[i] for i in top_indices]
        all_top_keywords.update(top_keywords)
        
        clusters_info.append({
            "cluster_id": int(cluster_id),
            "size": len(cluster_texts),
            "keywords": top_keywords,
            "sample": cluster_texts[0] if cluster_texts else ""
        })
        
    return sorted(clusters_info, key=lambda x: x['size'], reverse=True), list(all_top_keywords)[:15]

# --- API ENDPOINTS ---
@app.get("/api/youtube/{channel_id}")
async def get_core_stats(channel_id: str):
    if not db:
        return {"error": "Database not initialized. Check serviceAccountKey.json."}
        
    try:
        req = youtube.channels().list(part="statistics,snippet,contentDetails", id=channel_id)
        res = req.execute()
        if not res.get('items'): return {"error": "Channel not found"}
        
        item = res['items'][0]
        stats = item['statistics']
        subs = int(stats['subscriberCount'])
        views = int(stats['viewCount'])
        videos = int(stats['videoCount'])
        country = item['snippet'].get('country', 'Unknown')
        uploads_playlist = item['contentDetails']['relatedPlaylists']['uploads']

        history_ref = db.collection('youtube_stats').document(channel_id).collection('history')
        docs = list(history_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream())
        if not docs or docs[0].to_dict().get("subscribers") != subs:
            history_ref.add({"subscribers": subs, "timestamp": datetime.now(IST)})
            
        avg_views = views / max(videos, 1)
        sponsorship_value = (avg_views / 1000) * 20
        true_reach = subs + int(subs * 0.35) 
        
        return {
            "title": item['snippet']['title'],
            "subscribers": subs,
            "views": views,
            "videos": videos,
            "country": country,
            "uploads_id": uploads_playlist,
            "sponsorship_value": round(sponsorship_value),
            "true_reach": true_reach
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/history/{channel_id}")
async def get_history(channel_id: str):
    if not db: return []
    try:
        history_ref = db.collection('youtube_stats').document(channel_id).collection('history')
        docs = history_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(15).stream()
        return [{"subscribers": d.to_dict()["subscribers"], "timestamp": d.to_dict()["timestamp"].isoformat()} for d in docs][::-1]
    except Exception:
        return []

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "firebase": db is not None
    }

@app.get("/api/nlp/{uploads_id}")
async def run_nlp_pipeline(uploads_id: str):
    try:
        vid_req = youtube.playlistItems().list(part="contentDetails", playlistId=uploads_id, maxResults=1)
        vid_res = vid_req.execute()
        if not vid_res.get('items'): return {"error": "No videos found"}
        video_id = vid_res['items'][0]['contentDetails']['videoId']
        
        comment_req = youtube.commentThreads().list(part="snippet", videoId=video_id, maxResults=100, order="relevance")
        comment_res = comment_req.execute()
        
        raw_comments = []
        for item in comment_res.get('items', []):
            snippet = item['snippet']['topLevelComment']['snippet']
            raw_comments.append({"text": snippet['textDisplay']})
            
        sentiment_data = analyze_sentiment(raw_comments)
        cluster_data, top_keywords = perform_dbscan_clustering(raw_comments)
        
        return {
            "total_analyzed": len(raw_comments),
            "sentiment": sentiment_data,
            "clusters": cluster_data,
            "topKeywords": top_keywords
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)