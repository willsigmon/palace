#!/usr/bin/env python3
"""
Import Google Location History (Takeout) into PALACE/wsigomi.

Usage:
  1. Go to https://takeout.google.com
  2. Select only "Location History" (or "Timeline")
  3. Export as JSON format
  4. Download and unzip
  5. Run: python3 import-google-location.py /path/to/Records.json

The script reads Google's location history JSON and posts each entry
to the wsigomi OwnTracks endpoint for unified location tracking.
"""

import json
import sys
import os
import sqlite3
from datetime import datetime, timezone

ENRICHMENT_DB = os.environ.get('ENRICHMENT_DB', '/Volumes/NVME/wsigomi/data/enrichment.db')
API_URL = os.environ.get('API_URL', 'https://api.wsig.me')

def import_records_json(filepath: str):
    """Import Google Takeout Records.json format."""
    print(f"Loading {filepath}...")
    with open(filepath, 'r') as f:
        data = json.load(f)

    locations = data.get('locations', [])
    print(f"Found {len(locations)} location records")

    db = sqlite3.connect(ENRICHMENT_DB)
    db.execute("PRAGMA journal_mode = WAL")

    # Ensure tables exist
    db.execute("""
        CREATE TABLE IF NOT EXISTS google_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            accuracy INTEGER,
            activity TEXT,
            source TEXT DEFAULT 'google_takeout',
            timestamp TEXT NOT NULL,
            timestamp_ms INTEGER,
            UNIQUE(timestamp_ms)
        )
    """)

    inserted = 0
    skipped = 0
    batch = []

    for loc in locations:
        try:
            # Google format: latitudeE7 / longitudeE7 (integers scaled by 1e7)
            lat = loc.get('latitudeE7', loc.get('latitude'))
            lon = loc.get('longitudeE7', loc.get('longitude'))

            if lat is None or lon is None:
                skipped += 1
                continue

            # Convert E7 format if needed
            if isinstance(lat, int) and abs(lat) > 1000:
                lat = lat / 1e7
                lon = lon / 1e7

            ts_ms = int(loc.get('timestampMs', loc.get('timestamp', '0')))
            if ts_ms == 0:
                # Try ISO format
                ts_str = loc.get('timestamp', '')
                if ts_str:
                    dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                    ts_ms = int(dt.timestamp() * 1000)

            accuracy = loc.get('accuracy')

            # Activity detection
            activity = None
            if 'activity' in loc and loc['activity']:
                top = loc['activity'][0].get('activity', [{}])
                if top:
                    activity = top[0].get('type')

            ts_iso = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat()

            batch.append((lat, lon, accuracy, activity, ts_iso, ts_ms))

            if len(batch) >= 1000:
                db.executemany(
                    "INSERT OR IGNORE INTO google_locations (lat, lon, accuracy, activity, timestamp, timestamp_ms) VALUES (?, ?, ?, ?, ?, ?)",
                    batch
                )
                # Also insert into main locations table
                db.executemany(
                    "INSERT OR IGNORE INTO locations (source, latitude, longitude, label, timestamp) VALUES ('google', ?, ?, ?, ?)",
                    [(b[0], b[1], b[3] or 'google', b[4]) for b in batch]
                )
                inserted += len(batch)
                batch = []
                print(f"  Imported {inserted}/{len(locations)}...")
                db.commit()

        except Exception as e:
            skipped += 1

    # Final batch
    if batch:
        db.executemany(
            "INSERT OR IGNORE INTO google_locations (lat, lon, accuracy, activity, timestamp, timestamp_ms) VALUES (?, ?, ?, ?, ?, ?)",
            batch
        )
        db.executemany(
            "INSERT OR IGNORE INTO locations (source, latitude, longitude, label, timestamp) VALUES ('google', ?, ?, ?, ?)",
            [(b[0], b[1], b[3] or 'google', b[4]) for b in batch]
        )
        inserted += len(batch)
        db.commit()

    db.close()
    print(f"\nDone! Imported {inserted} locations, skipped {skipped}")
    print(f"Locations now available in PALACE at /api/locations")


def import_semantic_json(filepath: str):
    """Import Google Takeout Semantic Location History (Timeline) format."""
    print(f"Loading {filepath}...")
    with open(filepath, 'r') as f:
        data = json.load(f)

    db = sqlite3.connect(ENRICHMENT_DB)
    db.execute("PRAGMA journal_mode = WAL")

    objects = data.get('timelineObjects', [])
    inserted = 0

    for obj in objects:
        if 'placeVisit' in obj:
            pv = obj['placeVisit']
            loc = pv.get('location', {})
            lat = loc.get('latitudeE7', 0) / 1e7
            lon = loc.get('longitudeE7', 0) / 1e7
            name = loc.get('name', loc.get('address', ''))
            ts = pv.get('duration', {}).get('startTimestamp', '')

            if lat and lon and ts:
                db.execute(
                    "INSERT OR IGNORE INTO locations (source, latitude, longitude, address, label, timestamp) VALUES ('google_places', ?, ?, ?, ?, ?)",
                    (lat, lon, loc.get('address'), name, ts)
                )
                inserted += 1

    db.commit()
    db.close()
    print(f"Imported {inserted} place visits")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 import-google-location.py <Records.json or Semantic*.json>")
        print("\nExport from: https://takeout.google.com (select Location History)")
        sys.exit(1)

    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        sys.exit(1)

    with open(filepath) as f:
        data = json.load(f)

    if 'locations' in data:
        import_records_json(filepath)
    elif 'timelineObjects' in data:
        import_semantic_json(filepath)
    else:
        print("Unrecognized format. Expected Google Takeout Records.json or Semantic Location History.")
        sys.exit(1)
