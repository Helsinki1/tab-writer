from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import time
from typing import Dict, Any

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Tone prompts configuration
TONE_PROMPTS = {
    'professional': {
        'system': "You are a professional writing assistant. Continue the given text naturally in a professional, business-appropriate tone. Provide only the next few words or phrase that would logically follow. Keep it formal, clear, and polished. Do not repeat the input text.",
        'user_prefix': "Continue this text professionally: "
    },
    'casual': {
        'system': "You are a casual writing assistant. Continue the given text naturally in a casual, friendly conversational tone. Provide only the next few words or phrase that would logically follow. Keep it relaxed and approachable. Do not repeat the input text.",
        'user_prefix': "Continue this text casually: "
    },
    'creative': {
        'system': "You are a creative writing assistant. Continue the given text naturally in a creative, engaging, and expressive tone. Provide only the next few words or phrase that would logically follow. Be imaginative and captivating. Do not repeat the input text.",
        'user_prefix': "Continue this text creatively: "
    },
    'concise': {
        'system': "You are a concise writing assistant. Continue the given text naturally in a concise, direct, and brief manner. Provide only the next few words or phrase that would logically follow. Be clear and to the point. Do not repeat the input text.",
        'user_prefix': "Continue this text concisely: "
    }
}

# Request deduplication cache
request_cache = {}
CACHE_EXPIRY = 60  # seconds

def generate_autocomplete(text: str, tone: str) -> str:
    """Generate autocomplete suggestion using OpenAI"""
    try:
        # Check cache first
        cache_key = f"{text}_{tone}"
        current_time = time.time()
        
        if cache_key in request_cache:
            cached_result, timestamp = request_cache[cache_key]
            if current_time - timestamp < CACHE_EXPIRY:
                return cached_result
        
        # Get tone configuration
        tone_config = TONE_PROMPTS.get(tone.lower(), TONE_PROMPTS['professional'])
        
        # Create OpenAI request
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": tone_config['system']},
                {"role": "user", "content": f"{tone_config['user_prefix']}\"{text}\""}
            ],
            max_tokens=30,
            temperature=0.6,
            stop=["\n", ".", "!", "?"],
            presence_penalty=0.1
        )
        
        suggestion = response.choices[0].message.content.strip()
        
        # Cache the result
        request_cache[cache_key] = (suggestion, current_time)
        
        # Clean old cache entries
        keys_to_remove = [k for k, (_, timestamp) in request_cache.items() 
                         if current_time - timestamp >= CACHE_EXPIRY]
        for k in keys_to_remove:
            del request_cache[k]
        
        return suggestion
        
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        raise

@app.route('/api/autocomplete', methods=['POST'])
def autocomplete():
    """Handle autocomplete requests"""
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        if 'text' not in data or 'tone' not in data:
            return jsonify({'error': 'Missing required fields: text, tone'}), 400
        
        text = data['text'].strip()
        tone = data['tone'].strip().lower()
        
        # Validate inputs
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        if tone not in TONE_PROMPTS:
            return jsonify({'error': f'Invalid tone. Must be one of: {list(TONE_PROMPTS.keys())}'}), 400
        
        # Generate suggestion
        suggestion = generate_autocomplete(text, tone)
        
        return jsonify({
            'suggestion': suggestion,
            'tone': tone,
            'status': 'success'
        })
        
    except Exception as e:
        print(f"API error: {str(e)}")
        return jsonify({
            'error': 'Failed to generate suggestion',
            'details': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': time.time()})

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if OpenAI API key is configured
    if not os.getenv('OPENAI_API_KEY'):
        print("WARNING: OPENAI_API_KEY not found in environment variables")
        print("Please set your OpenAI API key in the .env file")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 