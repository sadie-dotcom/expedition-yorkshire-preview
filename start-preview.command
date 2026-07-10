#!/bin/bash
# Double-click this file to preview the Expedition Yorkshire site locally.
# It starts a static web server in this folder and opens it in your browser.
# Close the Terminal window (or press Ctrl-C) to stop the server.

cd "$(dirname "$0")" || exit 1
PORT=8000
echo "Starting local preview at http://127.0.0.1:${PORT} ..."
# Open the browser shortly after the server starts
( sleep 1; open "http://127.0.0.1:${PORT}/" ) &
python3 -m http.server "${PORT}" --bind 127.0.0.1
