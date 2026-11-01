import os, re
from typing import Optional, Dict, Tuple


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

try:
    from openai import OpenAI
    _client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
except Exception:
    _client = None

def ai_chat_completion(prompt: str, context=None) -> str:
    if _client:
        try:
            msgs = [{"role":"system","content":
                     "You are an expert AI career assistant for ATS/JD/Resume tips."}]
            if context: msgs += context
            msgs.append({"role":"user","content":prompt})
            r = _client.chat.completions.create(model=OPENAI_MODEL, messages=msgs, temperature=0.4)
            return r.choices[0].message.content.strip()
        except Exception:
            return "I'm unable to connect to the AI service right now. Please try again later."
    return ("(offline) I can help route your request.\n"
            "Say: 'ATS score', 'match JD', or 'resume tips'.")

def text_to_speech(text: str, out_path: str) -> str:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    try:
        from gtts import gTTS
        gTTS(text=text, lang="en").save(out_path)
        return out_path
    except Exception:
        import pyttsx3
        eng = pyttsx3.init()
        eng.save_to_file(text, out_path)
        eng.runAndWait()
        return out_path

def speech_to_text(audio_path: str) -> str:
    # whisper first
    try:
        import whisper
        model = whisper.load_model(os.getenv("WHISPER_MODEL","base"))
        res = model.transcribe(audio_path, fp16=False)
        return (res.get("text") or "").strip()
    except Exception:
        pass
    import speech_recognition as sr
    r = sr.Recognizer()
    with sr.AudioFile(audio_path) as src:
        audio = r.record(src)
    return r.recognize_google(audio)

_PATTERNS = {
    "ATS": re.compile(r"\b(ats|resume\s*score|check\s*score)\b", re.I),
    "JD": re.compile(r"\b(jd|job\s*description|match\s*jd|skill\s*match)\b", re.I),
    "TIPS": re.compile(r"\b(resume\s*tips|improve|improvement|suggest)\b", re.I),
}
def detect_intent(text: str) -> Optional[str]:
    for k, p in _PATTERNS.items():
        if p.search(text or ""): return k
    return None

def handle_chat_query(user_text: str, payload: Dict) -> Tuple[str, Optional[Dict]]:
    intent = detect_intent(user_text or "")
    if intent == "ATS":
        return ("Sure — upload your resume PDF/DOCX, I’ll run ATS score.", {
            "type":"ATS", "endpoint":"/ats/check", "method":"POST",
            "expected_payload":{"resume_file":"<file>"}
        })
    if intent == "JD":
        return ("Okay — upload resume + JD. I’ll compute match & missing skills.", {
            "type":"JD","endpoint":"/jd/match","method":"POST",
            "expected_payload":{"resume_file":"<file>","jd_file_or_text":"<file/text>"}
        })
    if intent == "TIPS":
        return ("Share your resume, I’ll give precise improvement tips.", {
            "type":"TIPS","endpoint":"/resume/tips","method":"POST",
            "expected_payload":{"resume_file":"<file>"}
        })
    return ai_chat_completion(user_text, payload.get("context")), None
