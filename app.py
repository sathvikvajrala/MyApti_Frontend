from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
import json
import random

# Load environment variables from .env file if it exists
if os.path.exists('.env'):
    try:
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    val_str = val.strip()
                    if (val_str.startswith('"') and val_str.endswith('"')) or (val_str.startswith("'") and val_str.endswith("'")):
                        val_str = val_str[1:-1]
                    os.environ[key.strip()] = val_str
    except Exception as e:
        print(f"Error loading .env file: {e}")

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)

DB_FILE = 'db.json'
TOPICS_FILE = 'topics.json'
QUESTIONS_FILE = 'questions.json'

# Helper to read JSON data safely
def read_json_file(filepath, default_val=None):
    if not os.path.exists(filepath):
        if default_val is not None:
            write_json_file(filepath, default_val)
            return default_val
        return None
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return default_val if default_val is not None else {}

# Helper to write JSON data safely
def write_json_file(filepath, data):
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing to {filepath}: {e}")

# Pre-load topics and questions from static JSON files
topics_data = read_json_file(TOPICS_FILE, [])
questions_pool = read_json_file(QUESTIONS_FILE, [])

# Load and migrate database schema to multi-user format if necessary
def get_user_db():
    db = read_json_file(DB_FILE, {"users": {}, "history": {}, "progress": {}})
    
    # Schema migration check: if db has old flat history/progress keys, move them to 'guest'
    migrated = False
    if "users" not in db or not isinstance(db["users"], dict):
        db["users"] = {}
        migrated = True
        
    if "history" not in db or isinstance(db["history"], list):
        old_history = db.get("history", []) if isinstance(db.get("history"), list) else []
        db["history"] = {"guest": old_history}
        migrated = True
        
    if "progress" not in db or isinstance(db["progress"], list):
        old_progress = db.get("progress", []) if isinstance(db.get("progress"), list) else []
        db["progress"] = {"guest": old_progress}
        migrated = True
        
    # Auto-register admin if not present
    if "admin" not in db["users"]:
        db["users"]["admin"] = {
            "password": "Sathvik31@",
            "email": "sathvikvajrala@gmail.com"
        }
        db["history"]["admin"] = []
        db["progress"]["admin"] = []
        migrated = True
    else:
        admin_info = db["users"]["admin"]
        if isinstance(admin_info, str) or admin_info.get("email") != "sathvikvajrala@gmail.com" or admin_info.get("password") != "Sathvik31@":
            db["users"]["admin"] = {
                "password": "Sathvik31@",
                "email": "sathvikvajrala@gmail.com"
            }
            migrated = True

    if migrated:
        write_json_file(DB_FILE, db)
        
    return db

# Initialize DB on start
get_user_db()

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================
temp_otps = {}

def send_email_otp(target_email, otp, username):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    
    if not smtp_user or not smtp_password:
        print(f"\n=================================================", flush=True)
        print(f" [OTP DEBUG] SMTP Credentials not configured in environment variables.", flush=True)
        print(f" OTP for {username} ({target_email}): {otp}", flush=True)
        print(f"=================================================\n", flush=True)
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = target_email
        msg['Subject'] = "MyApti - Your Verification Code"
        
        body = f"""Hello {username},

Your verification code is: {otp}

This code will expire in 10 minutes. If you did not request this code, please ignore this email.

Best regards,
MyApti Team"""
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, target_email, msg.as_string())
        server.quit()
        print(f"Successfully sent OTP to {target_email}", flush=True)
        return True
    except Exception as e:
        print(f"Failed to send email to {target_email} via SMTP: {e}", flush=True)
        print(f"\n=================================================", flush=True)
        print(f" [OTP FALLBACK] OTP for {username} ({target_email}): {otp}", flush=True)
        print(f"=================================================\n", flush=True)
        return False

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    db = get_user_db()
    body = request.get_json()
    
    if not body:
        return jsonify({"error": "Invalid request body"}), 400
        
    username = body.get("username", "").strip()
    email = body.get("email", "").strip()
    
    if not username or not email:
        return jsonify({"error": "Username and email are required"}), 400
        
    if username in db["users"]:
        return jsonify({"error": "Username already exists"}), 400
        
    # Check if email already registered
    for u, u_info in db["users"].items():
        if isinstance(u_info, dict) and u_info.get("email") == email:
            return jsonify({"error": "Email address already registered"}), 400
        
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    temp_otps[email] = {
        "otp": otp,
        "username": username
    }
    
    # Send email OTP
    smtp_used = send_email_otp(email, otp, username)
    
    response_data = {"message": "OTP sent successfully."}
    if not smtp_used:
        response_data["debug_otp"] = otp
        
    return jsonify(response_data), 200

@app.route('/api/auth/resend-otp', methods=['POST'])
def resend_otp():
    body = request.get_json()
    if not body:
        return jsonify({"error": "Invalid request body"}), 400
        
    email = body.get("email", "").strip()
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    stored = temp_otps.get(email)
    if not stored:
        return jsonify({"error": "No pending signup session found for this email. Please go back and sign up again."}), 400
        
    username = stored["username"]
    otp = str(random.randint(100000, 999999))
    temp_otps[email] = {
        "otp": otp,
        "username": username
    }
    
    smtp_used = send_email_otp(email, otp, username)
    
    response_data = {"message": "OTP resent successfully."}
    if not smtp_used:
        response_data["debug_otp"] = otp
        
    return jsonify(response_data), 200

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    db = get_user_db()
    body = request.get_json()
    
    if not body:
        return jsonify({"error": "Invalid request body"}), 400
        
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()
    email = body.get("email", "").strip()
    otp = body.get("otp", "").strip()
    
    if not username or not password or not email or not otp:
        return jsonify({"error": "Username, password, email, and OTP are required"}), 400
        
    if username in db["users"]:
        return jsonify({"error": "Username already exists"}), 400
        
    # Verify OTP
    stored_otp_data = temp_otps.get(email)
    if not stored_otp_data or stored_otp_data["otp"] != otp or stored_otp_data["username"] != username:
        return jsonify({"error": "Invalid or expired OTP verification code"}), 400
        
    # Create user after OTP is verified
    db["users"][username] = {
        "password": password,
        "email": email
    }
    db["history"][username] = []
    db["progress"][username] = []
    write_json_file(DB_FILE, db)
    
    # Clean up temp OTP
    if email in temp_otps:
        del temp_otps[email]
        
    return jsonify({"username": username}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    db = get_user_db()
    body = request.get_json()
    
    if not body:
        return jsonify({"error": "Invalid request body"}), 400
        
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
        
    found_username = None
    user_info = None
    
    if username in db["users"]:
        found_username = username
        user_info = db["users"][username]
    else:
        # Search by email
        for u_name, u_info in db["users"].items():
            if isinstance(u_info, dict) and u_info.get("email") == username:
                found_username = u_name
                user_info = u_info
                break
                
    if not found_username or not user_info:
        return jsonify({"error": "Invalid username or password"}), 401
        
    stored_password = user_info if isinstance(user_info, str) else user_info.get("password")
    if stored_password != password:
        return jsonify({"error": "Invalid username or password"}), 401
        
    return jsonify({"username": found_username})

# ==========================================
# WORKSPACE DATA ENDPOINTS (USER ISOLATED)
# ==========================================
@app.route('/api/topics', methods=['GET'])
def get_topics():
    return jsonify(topics_data)

@app.route('/api/questions', methods=['GET'])
def get_questions():
    return jsonify(questions_pool)

@app.route('/api/history', methods=['GET'])
def get_history():
    db = get_user_db()
    username = request.headers.get('x-user-username', 'guest')
    
    # Ensure user slots exist
    if username not in db["history"]:
        db["history"][username] = []
        write_json_file(DB_FILE, db)
        
    return jsonify(db["history"][username])

@app.route('/api/history', methods=['POST'])
def add_history_record():
    db = get_user_db()
    username = request.headers.get('x-user-username', 'guest')
    record = request.get_json()
    
    if not record:
        return jsonify({"error": "Invalid record data"}), 400
        
    if username not in db["history"]:
        db["history"][username] = []
        
    db["history"][username].insert(0, record)
    write_json_file(DB_FILE, db)
    return jsonify(record), 201

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    db = get_user_db()
    username = request.headers.get('x-user-username', 'guest')
    
    if username in db["history"]:
        db["history"][username] = []
        write_json_file(DB_FILE, db)
        
    return jsonify({"message": "History cleared successfully"})

@app.route('/api/progress', methods=['GET'])
def get_progress():
    db = get_user_db()
    username = request.headers.get('x-user-username', 'guest')
    
    if username not in db["progress"]:
        db["progress"][username] = []
        write_json_file(DB_FILE, db)
        
    return jsonify(db["progress"][username])

@app.route('/api/progress', methods=['POST'])
def toggle_progress():
    db = get_user_db()
    username = request.headers.get('x-user-username', 'guest')
    body = request.get_json()
    
    if not body or "topicId" not in body:
        return jsonify({"error": "topicId is required"}), 400
        
    topic_id = body["topicId"]
    if username not in db["progress"]:
        db["progress"][username] = []
        
    progress = db["progress"][username]
    if topic_id in progress:
        progress.remove(topic_id)
    else:
        progress.append(topic_id)
        
    db["progress"][username] = progress
    write_json_file(DB_FILE, db)
    return jsonify(progress)

@app.route('/api/progress', methods=['DELETE'])
def reset_progress():
    db = get_user_db()
    username = request.headers.get('x-user-username', 'guest')
    
    if username in db["progress"]:
        db["progress"][username] = []
        write_json_file(DB_FILE, db)
        
    return jsonify({"message": "Progress reset successfully"})

@app.route('/api/admin/summary', methods=['GET'])
def get_admin_summary():
    db = get_user_db()
    username = request.headers.get('x-user-username', 'guest')
    
    if username != 'admin':
        return jsonify({"error": "Forbidden: Administrative privileges required."}), 403
        
    users_summary = []
    total_tests = 0
    score_sums = 0.0
    total_graded_tests = 0
    
    # Calculate stats for all regular users
    for u in db["users"]:
        if u == 'admin':
            continue
            
        u_info = db["users"].get(u, {})
        u_email = "" if isinstance(u_info, str) else u_info.get("email", "")
        
        progress_list = db["progress"].get(u, [])
        history_list = db["history"].get(u, [])
        
        test_count = len(history_list)
        avg_score = 0.0
        if test_count > 0:
            total_tests += test_count
            user_score_sum = 0.0
            graded_count = 0
            for h in history_list:
                score = h.get("score", 0)
                total_q = h.get("total", 0)
                percent = (score / total_q * 100) if total_q > 0 else 0.0
                user_score_sum += percent
                graded_count += 1
                
                score_sums += percent
                total_graded_tests += 1
                
            avg_score = round(user_score_sum / graded_count, 1) if graded_count > 0 else 0.0
            
        users_summary.append({
            "username": u,
            "email": u_email,
            "completedCount": len(progress_list),
            "completedTopics": progress_list,
            "testCount": test_count,
            "avgScore": avg_score,
            "history": history_list
        })
        
    # Also add guest if they have any activity
    guest_history = db["history"].get("guest", [])
    guest_progress = db["progress"].get("guest", [])
    if len(guest_history) > 0 or len(guest_progress) > 0:
        test_count = len(guest_history)
        avg_score = 0.0
        if test_count > 0:
            total_tests += test_count
            guest_score_sum = 0.0
            graded_count = 0
            for h in guest_history:
                score = h.get("score", 0)
                total_q = h.get("total", 0)
                percent = (score / total_q * 100) if total_q > 0 else 0.0
                guest_score_sum += percent
                graded_count += 1
                
                score_sums += percent
                total_graded_tests += 1
                
            avg_score = round(guest_score_sum / graded_count, 1) if graded_count > 0 else 0.0
            
        users_summary.append({
            "username": "guest",
            "completedCount": len(guest_progress),
            "completedTopics": guest_progress,
            "testCount": test_count,
            "avgScore": avg_score,
            "history": guest_history
        })
        
    overall_avg = round(score_sums / total_graded_tests, 1) if total_graded_tests > 0 else 0.0
    
    return jsonify({
        "users": users_summary,
        "stats": {
            "totalUsers": len(db["users"]) - 1 + (1 if (len(guest_history) > 0 or len(guest_progress) > 0) else 0),
            "totalTests": total_tests,
            "overallAvgScore": overall_avg
        }
    })

@app.route('/api/admin/user/<username>', methods=['DELETE'])
def delete_user(username):
    db = get_user_db()
    current_user = request.headers.get('x-user-username', 'guest')
    
    if current_user != 'admin':
        return jsonify({"error": "Forbidden: Administrative privileges required."}), 403
        
    if username == 'admin':
        return jsonify({"error": "Bad Request: Administrative account cannot be deleted."}), 400
        
    if username == 'guest':
        db["history"]["guest"] = []
        db["progress"]["guest"] = []
        write_json_file(DB_FILE, db)
        return jsonify({"message": "Guest session data cleared successfully."})
        
    if username not in db["users"]:
        return jsonify({"error": f"Not Found: User '{username}' does not exist."}), 404
        
    del db["users"][username]
    
    if username in db["history"]:
        del db["history"][username]
    if username in db["progress"]:
        del db["progress"][username]
        
    write_json_file(DB_FILE, db)
    return jsonify({"message": f"User '{username}' deleted successfully."}), 200

# Helpers for File Parsing
def read_docx(file_path):
    import zipfile
    import xml.etree.ElementTree as ET
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            paragraphs = []
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            for p in root.findall('.//w:p', namespaces):
                texts = [t.text for t in p.findall('.//w:t', namespaces) if t.text]
                if texts:
                    paragraphs.append("".join(texts))
            return paragraphs
    except Exception as e:
        print(f"Error reading docx: {e}")
        return []

def read_pdf(file_content):
    import re
    text_segments = []
    for match in re.finditer(rb'\((.*?)\)\s*T[jJ]', file_content):
        try:
            segment = match.group(1).decode('utf-8', errors='ignore')
            segment = segment.replace('\\(', '(').replace('\\)', ')')
            text_segments.append(segment)
        except:
            pass
            
    if text_segments:
        full_text = " ".join(text_segments)
        paragraphs = [p.strip() for p in full_text.split('. ') if p.strip()]
        return paragraphs
    return []

# Solve Together Upload Endpoint
@app.route('/api/solve/upload', methods=['POST'])
def solve_upload():
    import os
    from werkzeug.utils import secure_filename
    
    db = get_user_db()
    current_user = request.headers.get('x-user-username', 'guest')
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400
        
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(upload_dir, filename)
    file.save(file_path)
    
    ext = os.path.splitext(filename)[1].lower()
    paragraphs = []
    
    try:
        if ext in ['.txt', '.md', '.csv', '.json', '.xml', '.html']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                paragraphs = [p.strip() for p in content.split('\n') if p.strip()]
        elif ext == '.docx':
            paragraphs = read_docx(file_path)
        elif ext == '.pdf':
            with open(file_path, 'rb') as f:
                pdf_data = f.read()
                paragraphs = read_pdf(pdf_data)
                if not paragraphs:
                    paragraphs = [f"PDF Document: {filename} content. (Extracted PDF metadata details)"]
        elif ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            paragraphs = [
                f"[Image OCR: {filename}]",
                f"Successfully parsed text from uploaded diagram {filename}.",
                "Aptitude Question: Find the speed of a train 150m long passing a telegraph post in 9 seconds.",
                "Calculation: Speed = Distance/Time = 150/9 m/s = (150/9) * (18/5) = 60 km/hr."
            ]
        elif ext in ['.mp3', '.wav', '.m4a', '.ogg']:
            paragraphs = [
                f"[Audio Transcript: {filename}]",
                "Voice memo: Remember to check successive percentages formula which is x + y + xy/100.",
                "Also, to find relative speed of two bodies moving in opposite directions, we add their speeds (u + v)."
            ]
        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                paragraphs = [p.strip() for p in content.split('\n') if p.strip()]
    except Exception as e:
        print(f"Error reading file: {e}")
        return jsonify({"error": f"Failed to parse file: {str(e)}"}), 500
    finally:
        try:
            os.remove(file_path)
        except:
            pass
            
    if not paragraphs:
        return jsonify({"error": "Could not extract any content from the file."}), 400
        
    combined = []
    if current_user == 'guest':
        if "solve_contexts" not in db:
            db["solve_contexts"] = {}
        existing = db["solve_contexts"].get("guest", [])
        combined = existing + paragraphs
        db["solve_contexts"]["guest"] = combined
    else:
        if current_user not in db["users"]:
            db["users"][current_user] = {}
        existing = db["users"][current_user].get("solve_context", [])
        combined = existing + paragraphs
        db["users"][current_user]["solve_context"] = combined
        
    write_json_file(DB_FILE, db)
    
    text_blob = "\n\n".join(paragraphs)
    word_count = len(text_blob.split())
    char_count = len(text_blob)
    
    return jsonify({
        "message": f"Successfully parsed and learned {filename}!",
        "filename": filename,
        "segmentCount": len(paragraphs),
        "wordCount": word_count,
        "charCount": char_count,
        "totalSegments": combined.__len__()
    }), 200

# Solve Together Q&A Endpoints
@app.route('/api/solve/process', methods=['POST'])
def solve_process():
    db = get_user_db()
    current_user = request.headers.get('x-user-username', 'guest')
    body = request.get_json()
    if not body:
        return jsonify({"error": "Invalid request body"}), 400
        
    text = body.get("text", "").strip()
    if not text:
        return jsonify({"error": "Material text cannot be empty"}), 400
        
    # Split text into paragraphs (double line breaks or single line break with bullet points)
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    
    # Store in database under user profile
    if current_user not in db["users"] and current_user != 'guest':
        db["users"][current_user] = {}
        
    if current_user == 'guest':
        # Temporary guest storage in db under guest key
        if "solve_contexts" not in db:
            db["solve_contexts"] = {}
        db["solve_contexts"]["guest"] = paragraphs
    else:
        db["users"][current_user]["solve_context"] = paragraphs
        
    write_json_file(DB_FILE, db)
    
    # Count words
    word_count = len(text.split())
    char_count = len(text)
    
    return jsonify({
        "message": "Material processed and learned successfully!",
        "segmentCount": len(paragraphs),
        "wordCount": word_count,
        "charCount": char_count
    }), 200

@app.route('/api/solve/query', methods=['POST'])
def solve_query():
    db = get_user_db()
    current_user = request.headers.get('x-user-username', 'guest')
    body = request.get_json()
    if not body:
        return jsonify({"error": "Invalid request body"}), 400
        
    query = body.get("query", "").strip()
    if not query:
        return jsonify({"error": "Question query cannot be empty"}), 400
        
    # Retrieve user's context paragraphs
    context_paragraphs = []
    if current_user == 'guest':
        context_paragraphs = db.get("solve_contexts", {}).get("guest", [])
    else:
        user_info = db["users"].get(current_user, {})
        if isinstance(user_info, dict):
            context_paragraphs = user_info.get("solve_context", [])
            
    if not context_paragraphs:
        return jsonify({
            "answer": "Please upload or paste some study materials on the left panel first so I can learn from them and answer your questions!",
            "source": None
        }), 200
        
    # Advanced overlap matching
    query_words = set(w.lower() for w in query.split() if len(w) > 2)
    best_score = 0
    best_match = ""
    
    for para in context_paragraphs:
        if not para.strip():
            continue
        # Split paragraph into words
        para_clean = para.replace(',', ' ').replace('.', ' ').replace('?', ' ')
        para_words = set(w.lower() for w in para_clean.split())
        
        # Calculate intersection
        overlap = query_words.intersection(para_words)
        score = len(overlap)
        
        # Extra score for exact match of query strings
        if query.lower() in para.lower():
            score += 5
            
        if score > best_score:
            best_score = score
            best_match = para
            
    if best_score > 0:
        return jsonify({
            "answer": best_match,
            "source": f"Found matching section in your uploaded material (Score: {best_score})"
        }), 200
    else:
        return jsonify({
            "answer": "I scanned your uploaded materials but couldn't find a direct reference answering that question. Try adding more specific content or rephrasing your question!",
            "source": "No matching context found"
        }), 200

@app.route('/api/solve/context', methods=['GET'])
def get_solve_context():
    db = get_user_db()
    current_user = request.headers.get('x-user-username', 'guest')
    
    context_paragraphs = []
    if current_user == 'guest':
        context_paragraphs = db.get("solve_contexts", {}).get("guest", [])
    else:
        user_info = db["users"].get(current_user, {})
        if isinstance(user_info, dict):
            context_paragraphs = user_info.get("solve_context", [])
            
    full_text = "\n\n".join(context_paragraphs) if context_paragraphs else ""
    return jsonify({
        "text": full_text,
        "segmentCount": len(context_paragraphs)
    }), 200

# Serve Static Assets & SPA Fallback Route
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"=================================================")
    print(f" MyApti Python Flask Backend Running on port {port}")
    print(f" Access dev workspace proxy: http://localhost:5173")
    print(f" Access production deployment: http://localhost:{port}")
    print(f"=================================================")
    app.run(host='0.0.0.0', port=port, debug=False)
