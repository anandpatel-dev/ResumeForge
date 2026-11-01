import os
import datetime
import tempfile
import json
from io import BytesIO
from typing import Dict, Any

from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
from jinja2 import Environment, FileSystemLoader, select_autoescape
from xhtml2pdf import pisa

import fitz   # PyMuPDF for PDFs
import docx   # python-docx for DOCX

from extensions import db

# =====================================================
# Blueprint
# =====================================================
bp = Blueprint("resume", __name__)

# =====================================================
# Models
# =====================================================
class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String, nullable=True)
    data = db.Column(db.Text, nullable=False)  # JSON resume data
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class ResumeTemplate(db.Model):
    __tablename__ = "resume_templates"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    slug = db.Column(db.String, unique=True, nullable=False)
    file_path = db.Column(db.String, nullable=False)  # path to HTML file
    preview_url = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


# =====================================================
# Helpers
# =====================================================
ALLOWED_EXTENSIONS = {"pdf", "docx"}

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_pdf(file_stream) -> str:
    """Extract text from PDF"""
    text = ""
    doc = fitz.open(stream=file_stream.read(), filetype="pdf")
    for page in doc:
        text += page.get_text("text") + "\n"
    return text


def parse_docx(file_stream) -> str:
    """Extract text from DOCX"""
    text = ""
    doc = docx.Document(file_stream)
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text


def render_template_to_pdf(template_path: str, context: Dict[str, Any]) -> BytesIO:
    """Render Jinja2 template to PDF"""
    env = Environment(
        loader=FileSystemLoader(os.path.dirname(template_path)),
        autoescape=select_autoescape(["html", "xml"])
    )
    template = env.get_template(os.path.basename(template_path))
    html_content = template.render(**context)

    pdf_buffer = BytesIO()
    pisa.CreatePDF(html_content, dest=pdf_buffer)
    pdf_buffer.seek(0)
    return pdf_buffer


# =====================================================
# Routes
# =====================================================
@bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.datetime.utcnow().isoformat()})


@bp.route("/upload", methods=["POST"])
def upload_resume():
    """Upload and parse resume file"""
    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[1].lower()

    try:
        text = parse_pdf(file) if ext == "pdf" else parse_docx(file)
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to parse file: {e}"}), 500

    return jsonify({"success": True, "content": text})


@bp.route("/ats", methods=["POST"])
def ats_score():
    """Calculate ATS score from resume text"""
    data = request.get_json()
    resume_text = data.get("resume", "")

    if not resume_text:
        return jsonify({"success": False, "message": "No resume data"}), 400

    # 🔑 Dummy ATS calculation (replace with real NLP later)
    keywords = ["python", "java", "sql", "flask", "django"]
    score = sum(1 for k in keywords if k.lower() in resume_text.lower())
    ats = int((score / len(keywords)) * 100)

    return jsonify({"success": True, "ats_score": ats})


@bp.route("/jd-match", methods=["POST"])
def jd_match():
    """Compare resume vs JD for match score"""
    data = request.get_json()
    resume_text = data.get("resume", "")
    jd_text = data.get("job_description", "")

    if not resume_text or not jd_text:
        return jsonify({"success": False, "message": "Missing resume or job description"}), 400

    resume_words = set(resume_text.lower().split())
    jd_words = set(jd_text.lower().split())
    common = resume_words.intersection(jd_words)

    score = int((len(common) / len(jd_words)) * 100) if jd_words else 0
    return jsonify({"success": True, "match_score": score})


@bp.route("/templates", methods=["GET"])
def get_templates():
    """Return available templates"""
    templates = ResumeTemplate.query.all()
    result = [
        {
            "id": t.id,
            "name": t.name,
            "slug": t.slug,
            "preview_url": t.preview_url,
        }
        for t in templates
    ]
    return jsonify({"success": True, "templates": result})


@bp.route("/export", methods=["POST"])
def export_resume():
    """Export resume with selected template to PDF"""
    data = request.get_json()
    resume_data = data.get("resume")
    template_slug = data.get("template")

    if not resume_data or not template_slug:
        return jsonify({"success": False, "message": "Missing data"}), 400

    template = ResumeTemplate.query.filter_by(slug=template_slug).first()
    if not template:
        return jsonify({"success": False, "message": "Template not found"}), 404

    template_path = template.file_path
    try:
        pdf = render_template_to_pdf(template_path, {"resume": resume_data})
    except Exception as e:
        return jsonify({"success": False, "message": f"Export failed: {e}"}), 500

    return send_file(
        pdf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"resume_{template_slug}.pdf",
    )
