# lii-scraper/app.py
# Flask service — protected by X-Api-Key header.
# Run via gunicorn: gunicorn -w 2 -b 0.0.0.0:8000 app:app

import os
import logging
from flask import Flask, request, jsonify
from scraper import search_lii, fetch_document

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(message)s")

app = Flask(__name__)
API_KEY = os.environ.get("LII_API_KEY", "")


def _check_key() -> bool:
    if not API_KEY:
        return True  # No key configured — open (not recommended in production)
    return request.headers.get("X-Api-Key", "") == API_KEY


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/search", methods=["POST"])
def search():
    if not _check_key():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    query        = str(data.get("query", "")).strip()
    jurisdiction = str(data.get("jurisdiction", "")).strip()
    max_results  = int(data.get("maxResults", 8))
    max_results  = max(1, min(max_results, 20))

    if not query:
        return jsonify({"error": "query is required"}), 400
    if not jurisdiction:
        return jsonify({"error": "jurisdiction is required"}), 400

    try:
        result = search_lii(query, jurisdiction, max_results)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"[/search] {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/fetch", methods=["POST"])
def fetch():
    if not _check_key():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    url = str(data.get("url", "")).strip()
    if not url:
        return jsonify({"error": "url is required"}), 400

    try:
        result = fetch_document(url)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"[/fetch] {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
