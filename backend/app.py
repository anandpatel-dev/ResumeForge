from routes.ai_routes import ai_bp
from resume_api import bp as resume_bp
import os
import re
import datetime
from collections import Counter

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# ✅ Single shared instances
from extensions import db, jwt

# File parsing libs
import fitz            # PyMuPDF
import docx            # python-docx

# NLP / ML
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import html
import json

# DB + Auth
from flask_jwt_extended import ( create_access_token, jwt_required, get_jwt_identity,
    verify_jwt_in_request
)# ================= Init & resources =================
load_dotenv()

# Ensure NLTK resources
NLTK_RESOURCES = {
    "corpora/stopwords": "stopwords",
    "tokenizers/punkt": "punkt",
    "corpora/wordnet": "wordnet",
}

for resource_path, package_name in NLTK_RESOURCES.items():
    try:
        nltk.data.find(resource_path)
    except LookupError:
        nltk.download(package_name, quiet=True)

STOPWORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

# ================= App config =================
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL", "*")}})

# ---- Config sabse pehle karo ----
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///resumeforge.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET")

# ---- Fir init_app karo ----
db.init_app(app)
jwt.init_app(app)


app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB

ALLOWED_EXT = {"pdf", "docx", "txt"}

# db is provided by extensions; initialized below
# jwt is provided by extensions; initialized below
# ================= Models =================

# ========== DB MODELS ==========
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)



# ================= Helpers =================
def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def _tokenize_words(text: str):
    return re.findall(r"[A-Za-z0-9+#\-\.]+", (text or "").lower())

def normalize_text(t: str) -> str:
    t = (t or "").replace("\x00", " ")
    t = re.sub(r"\s+", " ", t)
    return t.strip()

def flesch_reading_ease(text: str) -> float:
    words = _tokenize_words(text)
    if not words:
        return 0.0
    sentences = re.split(r"[.!?]+", text)
    sentences = [s for s in sentences if s.strip()]
    sent_count = max(1, len(sentences))

    vowels = "aeiouy"
    def syllables(w):
        w = re.sub(r'[^a-z]', '', w.lower())
        if not w:
            return 0
        count = 0
        prev_vowel = False
        for ch in w:
            is_v = ch in vowels
            if is_v and not prev_vowel:
                count += 1
            prev_vowel = is_v
        if w.endswith("e") and count > 1:
            count -= 1
        return max(1, count)

    syll_count = sum(syllables(w) for w in words)
    word_count = max(1, len(words))
    asl = word_count / sent_count
    asw = syll_count / word_count
    score = 206.835 - 1.015 * asl - 84.6 * asw
    return round(max(0, min(100, score)), 2)

# ================= File parsing =================

# ========== FILE PARSING HELPERS ==========
def parse_pdf(path):
    txt_parts = []
    images = 0
    doc = fitz.open(path)
    for page in doc:
        txt_parts.append(page.get_text("text") or "")
        images += len(page.get_images(full=True))
    return "\n".join(txt_parts), images, 0

def parse_docx(path):
    d = docx.Document(path)
    txt_parts = [p.text for p in d.paragraphs]
    tables = len(d.tables)
    return "\n".join(txt_parts), 0, tables

def parse_txt(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read(), 0, 0

def extract_text(file_path, filename):
    ext = filename.rsplit(".", 1)[1].lower()
    if ext == "pdf":
        return parse_pdf(file_path)
    if ext == "docx":
        return parse_docx(file_path)
    if ext == "txt":
        return parse_txt(file_path)
    raise ValueError("Unsupported file type")

# ================= Skill DB & helpers =================
ATS_KEYWORDS = [
    "python","flask","django","react","javascript","typescript","node",
    "sql","mysql","postgres","nosql","mongodb","docker","kubernetes",
    "aws","azure","gcp","git","html","css","rest","api","linux",
    "tensorflow","pytorch","ci/cd","kafka","redis","graphql","fastapi",
    "pandas","numpy","scikit-learn","nlp","opencv","microservices","terraform"
]

def extract_skills_by_db(text: str) -> set:
    t = (text or "").lower()
    found = set()
    for s in ATS_KEYWORDS:
        if s.lower() in t:
            found.add(s.lower())
    return found

def tfidf_cosine(a: str, b: str) -> float:
    try:
        vect = TfidfVectorizer(stop_words="english", min_df=1)
        X = vect.fit_transform([a or "", b or ""])
        return float(cosine_similarity(X[0:1], X[1:2])[0][0])
    except Exception:
        return 0.0

def extract_years_experience(text: str) -> float:
    matches = re.findall(r"(\d{1,2})\s*(\+|plus)?\s*(years|yrs|year)", (text or "").lower())
    years = [int(m[0]) for m in matches if m and m[0].isdigit()]
    return float(max(years) if years else 0.0)

# ================= Formatting / compliance =================
def detect_formatting_issues(text: str, images: int, tables: int):
    issues = []
    lines = [l for l in text.splitlines() if l.strip()]
    avg_len = sum(len(l) for l in lines)/max(1,len(lines))
    very_short_ratio = sum(1 for l in lines if len(l) < 25) / max(1, len(lines))
    if very_short_ratio > 0.45 and avg_len < 40:
        issues.append("Potential multi-column formatting which can confuse ATS.")
    if images > 0 or tables > 0:
        issues.append("Resume contains images/tables which may reduce ATS parse accuracy.")
    if re.search(r"[^\w\s\.\,\-\+\(\)/%]", text):
        issues.append("Excessive special characters may reduce ATS readability.")
    expected_sections = ["summary","experience","education","skills","projects","contact"]
    missing_sections = [s for s in expected_sections if s not in text.lower()]
    return issues, missing_sections

# ================= Scoring metrics =================
def parse_rate_score(text: str, images: int, tables: int) -> tuple[int, str]:
    words = _tokenize_words(text)
    wc = len(words)
    penal = (images + tables) * 5
    if wc < 100: score = 30
    elif wc < 300: score = 55
    elif wc < 700: score = 75
    else: score = 90
    score = max(10, min(95, score - penal))
    desc = "Estimated ATS parseability based on text length and presence of images/tables."
    return score, desc

def keyword_match_score(resume_text: str):
    resume_sk = extract_skills_by_db(resume_text)
    matched = sorted(list(resume_sk))
    missing = [k for k in ATS_KEYWORDS if k not in resume_sk]
    score = int(round((len(resume_sk) / max(1, len(ATS_KEYWORDS))) * 100))
    desc = "Detected role-specific technical keywords in the resume."
    return score, matched, missing, desc

def impact_score(resume_text: str):
    nums = re.findall(r"\d[\d\.,]*%?", (resume_text or ""))
    num_count = len(nums)
    metrics_words = len(re.findall(r"\b(increased|reduced|improved|optimized|grew|boosted|decreased|cut|saved|achieved)\b", (resume_text or "").lower()))
    score = min(100, 20 + num_count * 8 + metrics_words * 8)
    desc = "Presence of quantifiable achievements (numbers, %, growth words)."
    return int(score), desc

def readability_score(resume_text: str):
    fr = flesch_reading_ease(resume_text)
    score = int(round(fr))
    desc = "Readability (Flesch reading ease) — moderate scores preferred for clarity."
    return score, desc

def repetition_score(resume_text: str):
    words = _tokenize_words(resume_text)
    counts = Counter(words)
    repeats = sum(1 for w,c in counts.items() if c > 6)
    score = max(20, 100 - (repeats * 8))
    desc = "Penalty for repeated words/phrases (overused terms reduce impact)."
    return int(score), desc

def section_score(resume_text: str):
    present = [s for s in ["summary","experience","education","skills","projects"] if s in (resume_text or "").lower()]
    missing = [s for s in ["summary","experience","education","skills","projects"] if s not in (resume_text or "").lower()]
    score = int(round((len(present)/5.0) * 100))
    desc = "Presence of common resume sections (Summary, Skills, Experience, Education, Projects)."
    return score, present, missing, desc

def formatting_score(images: int, tables: int, text: str):
    base, issues = 100, []
    if images > 0 or tables > 0:
        base -= 20
        issues.append("Remove images/tables to improve ATS parsing.")
    if not re.search(r"(\n[-•]\s|\n\d+\.)", text.lower()):
        base -= 10
        issues.append("Use bullet points for achievements.")
    if re.search(r"[^\w\s\.\,\-\+\(\)/%]", text):
        base -= 5
        issues.append("Remove excessive special characters.")
    base = max(10, base)
    desc = "Formatting & structure suitability for ATS."
    return int(base), issues, desc

# ================= Aggregation (weights) =================
def aggregate_score(components: dict):
    weights = {
        "parse_rate": 0.18,
        "keywords": 0.32,
        "impact": 0.16,
        "readability": 0.12,
        "repetition": 0.06,
        "sections": 0.10,
        "formatting": 0.06
    }
    total = 0.0
    for k,w in weights.items():
        val = components.get(k, {}).get("score", 0)
        total += (val/100.0) * w
    final = int(round(total * 100))
    return final

# --------------------------
# JD Matcher route & helpers
# --------------------------

# ========== JD/Keywords Helpers ==========
def extract_keywords_from_text(text, keyword_db=None):
    kb = keyword_db if keyword_db is not None else ATS_KEYWORDS
    t = (text or "").lower()
    found = set()
    for kw in kb:
        if re.search(r"\b" + re.escape(kw.lower()) + r"\b", t):
            found.add(kw.lower())
    return found

def highlight_jd_html(jd_text, matched_set, missing_set, context_words=40):
    if not jd_text:
        return ""
    safe = html.escape(jd_text)
    tokens = re.split(r"(\W+)", safe)
    out_tokens = []
    for tk in tokens:
        low = tk.lower()
        wrapped = tk
        if low and re.match(r"^[A-Za-z0-9\+\#\-\.]+$", low):
            w = re.sub(r'[^a-z0-9\+\#\-\.]', '', low)
            if w in matched_set:
                wrapped = f'<mark style="background:#DCFCE7;color:#065F46;padding:0 4px;border-radius:4px;">{tk}</mark>'
            elif w in missing_set:
                wrapped = f'<mark style="background:#FFE4E6;color:#9F1239;padding:0 4px;border-radius:4px;">{tk}</mark>'
        out_tokens.append(wrapped)
    return "".join(out_tokens)

@app.route("/api/jd-match", methods=["POST"])
# ========== JD: Match & highlight ==========

def jd_match():
    try:
        try:
            verify_jwt_in_request(optional=True)
        except Exception:
            pass

        if "resume" not in request.files:
            return jsonify({"success": False, "message": "No resume uploaded (field name: resume)"}), 400

        resume_file = request.files["resume"]
        filename = secure_filename(resume_file.filename or "")
        if not filename or not allowed_file(filename):
            return jsonify({"success": False, "message": "Unsupported resume file type"}), 400

        jd_text = (request.form.get("job_description") or "").strip()
        if not jd_text and "jd_file" in request.files:
            jd_file = request.files["jd_file"]
            jfn = secure_filename(jd_file.filename or "")
            if jfn and allowed_file(jfn):
                tmp_jd_path = os.path.join(app.config["UPLOAD_FOLDER"], f"jd_{datetime.datetime.utcnow().timestamp()}_{jfn}")
                jd_file.save(tmp_jd_path)
                try:
                    jd_text, _, _ = extract_text(tmp_jd_path, jfn)
                finally:
                    try:
                        os.remove(tmp_jd_path)
                    except Exception:
                        pass

        save_path = os.path.join(app.config["UPLOAD_FOLDER"], f"jdmatch_{datetime.datetime.utcnow().timestamp()}_{filename}")
        resume_file.save(save_path)

        try:
            resume_text, images, tables = extract_text(save_path, filename)
            resume_text = normalize_text(resume_text)
            word_count = len(_tokenize_words(resume_text))

            if not jd_text:
                parse_score, _ = parse_rate_score(resume_text, images, tables)
                kw_score, matched, missing, _ = keyword_match_score(resume_text)
                imp_score, _ = impact_score(resume_text)
                read_score, _ = readability_score(resume_text)
                rep_score, _ = repetition_score(resume_text)
                sec_score, present_secs, missing_secs, _ = section_score(resume_text)
                fmt_score, fmt_issues, _ = formatting_score(images, tables, resume_text)

                components = {
                    "parse_rate": {"score": parse_score, "desc": "Parseability"},
                    "keywords": {"score": kw_score, "matched": matched, "missing": missing},
                    "impact": {"score": imp_score},
                    "readability": {"score": read_score},
                    "repetition": {"score": rep_score},
                    "sections": {"score": sec_score, "present": present_secs, "missing": missing_secs},
                    "formatting": {"score": fmt_score, "issues": fmt_issues}
                }
                final_ats = aggregate_score(components)

                suggestions = []
                if components["keywords"].get("missing"):
                    suggestions.append(f"Consider adding keywords: {', '.join(components['keywords']['missing'][:8])}.")
                if components["sections"].get("missing"):
                    suggestions.append(f"Add sections: {', '.join(components['sections']['missing'])}.")

                return jsonify({
                    "success": True,
                    "message": "No JD provided — returned ATS analysis for resume",
                    "ats_score": final_ats,
                    "breakdown": components,
                    "matched_skills": components["keywords"].get("matched", []),
                    "missing_skills": components["keywords"].get("missing", []),
                    "suggestions": suggestions,
                    "meta": {"word_count": word_count, "images": images, "tables": tables}
                }), 200

            jd_text = normalize_text(jd_text)

            jd_skills = extract_keywords_from_text(jd_text, ATS_KEYWORDS)
            resume_skills = extract_keywords_from_text(resume_text, ATS_KEYWORDS)

            matched = sorted(list(resume_skills.intersection(jd_skills)))
            missing = sorted(list(jd_skills.difference(resume_skills)))

            if jd_skills:
                match_score = round((len(matched) / max(1, len(jd_skills))) * 100, 2)
            else:
                sim = tfidf_cosine(resume_text, jd_text)
                match_score = round(sim * 100, 2)

            parse_score, parse_desc = parse_rate_score(resume_text, images, tables)
            kw_score, _, _, kw_desc = keyword_match_score(resume_text)
            imp_score, imp_desc = impact_score(resume_text)
            read_score, read_desc = readability_score(resume_text)
            rep_score, rep_desc = repetition_score(resume_text)
            sec_score, present_secs, missing_secs, sec_desc = section_score(resume_text)
            fmt_score, fmt_issues, fmt_desc = formatting_score(images, tables, resume_text)

            components = {
                "parse_rate": {"score": parse_score, "desc": parse_desc},
                "keywords": {"score": kw_score, "desc": kw_desc, "matched": matched, "missing": missing},
                "impact": {"score": imp_score, "desc": imp_desc},
                "readability": {"score": read_score, "desc": read_desc},
                "repetition": {"score": rep_score, "desc": rep_desc},
                "sections": {"score": sec_score, "desc": sec_desc, "present": present_secs, "missing": missing_secs},
                "formatting": {"score": fmt_score, "desc": fmt_desc, "issues": fmt_issues}
            }

            ats_score = aggregate_score(components)
            similarity = round(tfidf_cosine(resume_text, jd_text) * 100, 2)
            highlighted_html = highlight_jd_html(jd_text, set(matched), set(missing))

            suggestions = []
            if missing:
                suggestions.append(f"Add these role-relevant skills: {', '.join(missing[:8])}.")
            if missing_secs:
                suggestions.append(f"Add missing sections: {', '.join(missing_secs)}.")
            if fmt_issues:
                suggestions += fmt_issues
            if read_score < 45:
                suggestions.append("Improve readability: shorter sentences and bullets.")
            if imp_score < 30:
                suggestions.append("Add quantifiable achievements with numbers where possible.")

            return jsonify({
                "success": True,
                "match_score": match_score,
                "ats_score": ats_score,
                "similarity_percent": similarity,
                "matched_skills": matched,
                "missing_skills": missing,
                "highlighted_jd_html": highlighted_html,
                "suggestions": suggestions,
                "breakdown": components,
                "meta": {"word_count": word_count, "images": images, "tables": tables}
            }), 200

        finally:
            try:
                os.remove(save_path)
            except Exception:
                pass

    except Exception as e:
        app.logger.exception("JD match error")
        return jsonify({"success": False, "message": f"JD match error: {str(e)}"}), 500

# ================= Result model & routes =================

# ========== RESULTS: Save & Retrieve ==========
class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)  # null = anonymous
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    title = db.Column(db.String(255), nullable=True)
    payload = db.Column(db.JSON)  # store the full result JSON
    meta = db.Column(db.JSON, nullable=True)



@app.route("/api/results", methods=["POST"])
def save_result():
    try:
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            user_id = None

        data = None
        if request.is_json:
            data = request.get_json()
        else:
            if "result" in request.form:
                data = json.loads(request.form.get("result"))
            else:
                data = request.get_json(force=True)

        title = data.get("title") if isinstance(data, dict) else None
        payload = data if isinstance(data, dict) else {"result": str(data)}

        r = Result(user_id=user_id, title=title, payload=payload, meta=payload.get("meta") if isinstance(payload, dict) else None)
        db.session.add(r)
        db.session.commit()

        return jsonify({"success": True, "id": r.id, "message": "Saved"}), 201
    except Exception as e:
        app.logger.exception("Save result error")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/results", methods=["GET"])
@jwt_required()
def list_results():
    uid = get_jwt_identity()
    if not uid:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    items = Result.query.filter_by(user_id=uid).order_by(Result.created_at.desc()).limit(100).all()
    out = []
    for it in items:
        out.append({
            "id": it.id,
            "title": it.title,
            "created_at": it.created_at.isoformat(),
            "meta": it.meta,
            "payload": it.payload
        })
    return jsonify({"success": True, "results": out}), 200

@app.route("/api/results/<int:result_id>", methods=["GET"])
@jwt_required()
def get_result(result_id):
    uid = get_jwt_identity()
    r = Result.query.filter_by(id=result_id, user_id=uid).first()
    if not r:
        return jsonify({"success": False, "message": "Not found"}), 404
    return jsonify({"success": True, "result": {
        "id": r.id, "title": r.title, "created_at": r.created_at.isoformat(), "payload": r.payload, "meta": r.meta
    }}), 200

# ================= Misc routes =================
@app.route("/api/health")
def health():
    return {"ok": True, "time": datetime.datetime.utcnow().isoformat()}

@app.route("/api/signup", methods=["POST"])
# ========== AUTH: Sign-up ==========

def signup():
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not name or not email or not password:
        return jsonify({"success": False, "message": "All fields required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email already registered"}), 400
    user = User(name=name, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({"success": True, "message": "User created"}), 201

@app.route("/api/login", methods=["POST"])
# ========== AUTH: Login ==========

def login():
    data = request.get_json(force=True)
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
    token = create_access_token(identity=user.id, expires_delta=datetime.timedelta(hours=6))
    return jsonify({"success": True, "token": token, "user": {"name": user.name, "email": user.email}}), 200

@app.route("/api/ats-check", methods=["POST"])
# ========== ATS: Resume-only check ==========

def ats_check():
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    if "resume" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    f = request.files["resume"]
    filename = secure_filename(f.filename or "")
    if not filename or not allowed_file(filename):
        return jsonify({"success": False, "message": "Unsupported file type"}), 400

    save_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{datetime.datetime.utcnow().timestamp()}_{filename}")
    f.save(save_path)

    try:
        text, images, tables = extract_text(save_path, filename)
        text = normalize_text(text)
        word_count = len(_tokenize_words(text))

        parse_score, parse_desc = parse_rate_score(text, images, tables)
        kw_score, matched, missing, kw_desc = keyword_match_score(text)
        imp_score, imp_desc = impact_score(text)
        read_score, read_desc = readability_score(text)
        rep_score, rep_desc = repetition_score(text)
        sec_score, present_secs, missing_secs, sec_desc = section_score(text)
        fmt_score, fmt_issues, fmt_desc = formatting_score(images, tables, text)

        components = {
            "parse_rate": {"score": parse_score, "desc": parse_desc},
            "keywords": {"score": kw_score, "desc": kw_desc, "matched": matched, "missing": missing},
            "impact": {"score": imp_score, "desc": imp_desc},
            "readability": {"score": read_score, "desc": read_desc},
            "repetition": {"score": rep_score, "desc": rep_desc},
            "sections": {"score": sec_score, "desc": sec_desc, "present": present_secs, "missing": missing_secs},
            "formatting": {"score": fmt_score, "desc": fmt_desc, "issues": fmt_issues}
        }

        final_score = aggregate_score(components)

        suggestions = []
        if components["keywords"]["missing"]:
            suggestions.append(f"Consider adding keywords: {', '.join(components['keywords']['missing'][:8])}.")
        if components["sections"]["missing"]:
            suggestions.append(f"Add sections: {', '.join(components['sections']['missing'])}.")
        if fmt_issues:
            suggestions += fmt_issues
        if imp_score < 30:
            suggestions.append("Add quantifiable achievements (use numbers/percentages).")
        if read_score < 45:
            suggestions.append("Improve readability: use shorter sentences and bullets.")
        if rep_score < 70:
            suggestions.append("Avoid repeating the same words multiple times; vary action verbs.")

        response = {
            "success": True,
            "ats_score": final_score,
            "breakdown": components,
            "matched_keywords": components["keywords"].get("matched", []),
            "missing_keywords": components["keywords"].get("missing", []),
            "suggestions": suggestions,
            "meta": {
                "word_count": word_count,
                "readability": read_score,
                "images": images,
                "tables": tables
            }
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Parser error: {str(e)}"}), 500
    finally:
        try:
            os.remove(save_path)
        except Exception:
            pass

@app.route("/api/jd-ats-check", methods=["POST"])
# ========== ATS + JD: Combined check ==========

def jd_ats_check():
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    if "resume" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    jd_text = (request.form.get("job_description") or "").strip()
    f = request.files["resume"]
    filename = secure_filename(f.filename or "")
    if not filename or not allowed_file(filename):
        return jsonify({"success": False, "message": "Unsupported file type"}), 400

    save_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{datetime.datetime.utcnow().timestamp()}_{filename}")
    f.save(save_path)

    try:
        text, images, tables = extract_text(save_path, filename)
        text = normalize_text(text)
        word_count = len(_tokenize_words(text))

        base_resume_sk = extract_skills_by_db(text)
        jd_sk = extract_skills_by_db(jd_text)
        matched = sorted([k for k in base_resume_sk if k in jd_sk])
        missing = sorted([k for k in jd_sk if k not in base_resume_sk])

        parse_score, parse_desc = parse_rate_score(text, images, tables)
        kw_score = int(round((len(matched)/max(1,len(jd_sk))) * 100)) if jd_sk else keyword_match_score(text)[0]
        imp_score, imp_desc = impact_score(text)
        read_score, read_desc = readability_score(text)
        rep_score, rep_desc = repetition_score(text)
        sec_score, present_secs, missing_secs, sec_desc = section_score(text)
        fmt_score, fmt_issues, fmt_desc = formatting_score(images, tables, text)
        similarity = round(tfidf_cosine(text, jd_text) * 100, 2) if jd_text else 0.0

        components = {
            "parse_rate": {"score": parse_score, "desc": parse_desc},
            "keywords": {"score": kw_score, "desc": "JD-aware keyword match", "matched": matched, "missing": missing},
            "impact": {"score": imp_score, "desc": imp_desc},
            "readability": {"score": read_score, "desc": read_desc},
            "repetition": {"score": rep_score, "desc": rep_desc},
            "sections": {"score": sec_score, "desc": sec_desc, "present": present_secs, "missing": missing_secs},
            "formatting": {"score": fmt_score, "desc": fmt_desc, "issues": fmt_issues}
        }

        final_score = aggregate_score(components)
        final_score = min(100, int(round(final_score * 0.95 + similarity * 0.05)))

        suggestions = []
        if missing:
            suggestions.append(f"Add these role-relevant skills: {', '.join(missing[:8])}.")
        if missing_secs:
            suggestions.append(f"Add sections: {', '.join(missing_secs)}.")
        if fmt_issues:
            suggestions += fmt_issues
        if read_score < 45:
            suggestions.append("Improve readability with shorter sentences and simpler phrasing.")

        response = {
            "success": True,
            "ats_score": final_score,
            "matched_keywords": matched,
            "missing_keywords": missing,
            "jd_skills_detected": sorted(list(jd_sk)),
            "similarity_percent": similarity,
            "breakdown": components,
            "suggestions": suggestions,
            "meta": {
                "word_count": word_count,
                "readability": read_score,
                "images": images,
                "tables": tables
            }
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"JD parser error: {str(e)}"}), 500
    finally:
        try:
            os.remove(save_path)
        except Exception:
            pass
# ================= Blueprint Registration =================

app.register_blueprint(resume_bp, url_prefix="/api/resume")
app.register_blueprint(ai_bp, url_prefix="/api/ai")


# ================= Database Initialization =================

def initialize_database():
    with app.app_context():
        db.create_all()


# ================= Run Backend =================

if __name__ == "__main__":
    initialize_database()

    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=True
    )