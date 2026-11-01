
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from ai_chatbot import handle_chat_query

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/chat", methods=["POST"])
@jwt_required(optional=True)
def ai_chat():
    try:
        data = request.get_json(silent=True) or {}
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({
                "success": False,
                "reply": "Please enter a message."
            }), 400

        reply, action = handle_chat_query(user_message, data)

        return jsonify({
            "success": True,
            "reply": reply,
            "action": action
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Something went wrong while processing your request."
        }), 500
