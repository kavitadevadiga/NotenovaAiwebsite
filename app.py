from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

import sqlite3
import re
from collections import Counter
from pypdf import PdfReader
from docx import Document
from io import BytesIO


# =====================================================
# FLASK APPLICATION
# =====================================================

app = Flask(__name__)
CORS(app)

DATABASE = "users.db"


# =====================================================
# DATABASE
# =====================================================

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def create_database():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# =====================================================
# HOME
# =====================================================

@app.route("/")
def home():
    return "NoteNova AI backend is running!"


# =====================================================
# REGISTER
# =====================================================

@app.route("/register", methods=["POST"])
def register():

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400

    conn = get_db()

    try:
        existing_user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Account already exists"
            }), 409

        hashed_password = generate_password_hash(password)

        conn.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hashed_password)
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Account created successfully!"
        })

    finally:
        conn.close()


# =====================================================
# LOGIN
# =====================================================

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    conn = get_db()

    try:
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()
    finally:
        conn.close()

    if user and check_password_hash(user["password"], password):
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "name": user["name"],
                "email": user["email"]
            }
        })

    return jsonify({
        "success": False,
        "message": "Invalid email or password"
    }), 401


# =====================================================
# LOCAL NOTE SUMMARIZER
# ORIGINAL SUMMARIZATION LOGIC PRESERVED
# =====================================================

def summarize_notes(notes):

    # Clean extra spaces
    notes = re.sub(r'\s+', ' ', notes).strip()

    # Split notes into sentences
    sentences = re.split(r'(?<=[.!?])\s+', notes)

    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return "No meaningful text found."

    # Common words to ignore
    stop_words = {
        "the", "is", "are", "was", "were", "a", "an", "and",
        "or", "of", "to", "in", "on", "for", "with", "by",
        "from", "as", "at", "this", "that", "these", "those",
        "it", "its", "be", "has", "have", "had", "can", "will",
        "which", "who", "what", "when", "where", "how", "about",
        "into", "than", "also", "their", "there", "they", "them"
    }

    words = re.findall(r'\b[a-zA-Z]{3,}\b', notes.lower())

    useful_words = [
        word for word in words
        if word not in stop_words
    ]

    word_frequency = Counter(useful_words)

    # Score each sentence
    scored_sentences = []

    for index, sentence in enumerate(sentences):

        sentence_words = re.findall(
            r'\b[a-zA-Z]{3,}\b',
            sentence.lower()
        )

        score = sum(
            word_frequency.get(word, 0)
            for word in sentence_words
            if word not in stop_words
        )

        scored_sentences.append(
            (score, index, sentence)
        )

    # Select important sentences
    ranked = sorted(
        scored_sentences,
        reverse=True
    )

    number_of_sentences = min(
        max(3, len(sentences) // 3),
        5
    )

    selected = sorted(
        ranked[:number_of_sentences],
        key=lambda x: x[1]
    )

    short_summary = " ".join(
        item[2] for item in selected
    )

    # Detailed summary
    detailed_summary = " ".join(sentences)

    # Key points
    key_points = []

    for sentence in selected:
        key_points.append(sentence[2])

    # Limit very long detailed text
    if len(detailed_summary) > 5000:
        detailed_summary = detailed_summary[:5000] + "..."

    result = "SHORT SUMMARY:\n"
    result +=short_summary+ "\n\n"
    result += "DETAILED SUMMARY:\n"
    result += detailed_summary + "\n\n"
    result += "IMPORTANT KEY POINTS:\n"

    for point in key_points:
        result += "- " + point + "\n"

    return result


# =====================================================
# SUMMARIZE PASTED TEXT
# =====================================================

@app.route("/summarize", methods=["POST"])
def summarize():

    data = request.get_json() or {}

    notes = data.get("notes", "").strip()

    if not notes:
        return jsonify({
            "success": False,
            "message": "No notes provided"
        }), 400

    try:
        summary = summarize_notes(notes)

        return jsonify({
            "success": True,
            "summary": summary
        })

    except Exception as e:
        print("SUMMARY ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Summarization failed."
        }), 500


# =====================================================
# UPLOAD DOCUMENT AND SUMMARIZE
# =====================================================

@app.route("/summarize-file", methods=["POST"])
def summarize_file():

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "message": "Please upload a document."
        }), 400

    uploaded_file = request.files["file"]

    if not uploaded_file.filename:
        return jsonify({
            "success": False,
            "message": "Please select a file."
        }), 400

    filename = uploaded_file.filename.lower()
    file_bytes = uploaded_file.read()

    try:

        # Read PDF
        if filename.endswith(".pdf"):

            pdf = PdfReader(BytesIO(file_bytes))

            notes = "\n".join(
                page.extract_text() or ""
                for page in pdf.pages
            )

        # Read TXT
        elif filename.endswith(".txt"):

            notes = file_bytes.decode("utf-8-sig")

        # Read DOCX
        elif filename.endswith(".docx"):

            document = Document(BytesIO(file_bytes))

            notes = "\n".join(
                paragraph.text
                for paragraph in document.paragraphs
            )

        # Old DOC format is not supported directly
        elif filename.endswith(".doc"):

            return jsonify({
                "success": False,
                "message": "Please save your DOC file as PDF or DOCX."
            }), 400

        else:

            return jsonify({
                "success": False,
                "message": "Please upload a PDF, TXT, or DOCX file."
            }), 400

        if not notes.strip():
            return jsonify({
                "success": False,
                "message": (
                    "No readable text found in the document. "
                    "Scanned PDFs may require OCR."
                )
            }), 400

        # Use the original summarization function
        summary = summarize_notes(notes)

        return jsonify({
            "success": True,
            "summary": summary
        })

    except Exception as e:

        print("DOCUMENT SUMMARY ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Could not read the document."
        }), 500


# =====================================================
# START SERVER
# THIS MUST BE AT THE VERY BOTTOM
# =====================================================

create_database()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
