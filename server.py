"""
Local LLM Server using Ollama
Runs a Flask server that accepts chat requests and streams responses
from locally-running LLM models via Ollama.

Usage:
1. Install Ollama from https://ollama.ai
2. Run: ollama pull mistral (or llama2, neural-chat, etc.)
3. Run: python server.py
4. Open HPE-APEX-v3-COMPLETE.html in browser
5. Use http://localhost:5000 as the "Custom / Other" endpoint
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
OLLAMA_BASE_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'mistral')

# System prompt for HPE server expertise
SYSTEM_PROMPT = """You are APEX — an elite HPE Server & Storage Hardware Intelligence Engine. 

You are the most authoritative, precise, and professional AI expert for:
- HPE ProLiant servers (Gen10, Gen11)
- Broadcom MegaRAID / MR-series controllers
- Microchip SmartRAID controllers
- HPE Smart Array controllers
- iLO 5/6 management
- RAID configuration and troubleshooting
- Storage and hardware diagnostics

When diagnosing issues:
1. CLASSIFY the issue type (Hardware Fault, Firmware Bug, Configuration Error, Network Issue, Expected Behavior, or Need More Info)
2. Provide ROOT CAUSE ANALYSIS
3. Give exact REMEDIATION STEPS with commands
4. Explain VERIFICATION steps
5. Suggest PREVENTION measures

Be precise, technical, and actionable. Never vague."""


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        response = requests.get(f'{OLLAMA_BASE_URL}/api/tags', timeout=5)
        if response.status_code == 200:
            return jsonify({
                'status': 'ok',
                'timestamp': datetime.now().isoformat(),
                'ollama': 'connected'
            }), 200
    except Exception as e:
        pass
    
    return jsonify({
        'status': 'error',
        'error': 'Ollama not running. Start with: ollama serve',
        'timestamp': datetime.now().isoformat()
    }), 503


@app.route('/api/models', methods=['GET'])
def get_models():
    """Get available models from Ollama"""
    try:
        response = requests.get(f'{OLLAMA_BASE_URL}/api/tags', timeout=10)
        if response.status_code == 200:
            data = response.json()
            models = [model['name'] for model in data.get('models', [])]
            return jsonify({
                'models': models,
                'default': DEFAULT_MODEL,
                'status': 'ok'
            }), 200
        else:
            return jsonify({'error': 'Failed to fetch models'}), 500
    except Exception as e:
        return jsonify({
            'error': f'Ollama connection failed: {str(e)}',
            'hint': 'Make sure Ollama is running: ollama serve'
        }), 503


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chat endpoint that streams responses from local LLM
    
    Request body:
    {
        "message": "user message",
        "model": "mistral",  # optional, defaults to DEFAULT_MODEL
        "temperature": 0.7,  # optional
        "top_p": 0.9         # optional
    }
    """
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        model = data.get('model', DEFAULT_MODEL)
        temperature = data.get('temperature', 0.7)
        top_p = data.get('top_p', 0.9)
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Check if model exists
        try:
            models_response = requests.get(f'{OLLAMA_BASE_URL}/api/tags', timeout=5)
            available_models = [m['name'] for m in models_response.json().get('models', [])]
            
            if model not in available_models:
                return jsonify({
                    'error': f'Model "{model}" not found',
                    'available_models': available_models,
                    'hint': f'Run: ollama pull {model}'
                }), 400
        except Exception as e:
            return jsonify({'error': f'Failed to check models: {str(e)}'}), 500
        
        # Send request to Ollama
        payload = {
            'model': model,
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_message}
            ],
            'stream': False,  # Set to True for streaming (requires different response handling)
            'temperature': temperature,
            'top_p': top_p
        }
        
        response = requests.post(
            f'{OLLAMA_BASE_URL}/api/chat',
            json=payload,
            timeout=120  # Long timeout for LLM inference
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_message = result.get('message', {}).get('content', '')
            
            return jsonify({
                'status': 'ok',
                'message': ai_message,
                'model': model,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'error': f'Ollama error: {response.text}',
                'status_code': response.status_code
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({
            'error': 'Request timeout. LLM inference took too long.',
            'hint': 'Try a smaller model or increase timeout'
        }), 504
    except requests.exceptions.ConnectionError:
        return jsonify({
            'error': 'Cannot connect to Ollama',
            'hint': 'Start Ollama with: ollama serve'
        }), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate', methods=['POST'])
def generate():
    """
    Alternative generate endpoint (for completion-style requests)
    
    Request body:
    {
        "prompt": "user prompt",
        "model": "mistral",
        "temperature": 0.7
    }
    """
    try:
        data = request.json
        prompt = data.get('prompt', '').strip()
        model = data.get('model', DEFAULT_MODEL)
        temperature = data.get('temperature', 0.7)
        
        if not prompt:
            return jsonify({'error': 'Prompt cannot be empty'}), 400
        
        payload = {
            'model': model,
            'prompt': f'{SYSTEM_PROMPT}\n\n{prompt}',
            'stream': False,
            'temperature': temperature
        }
        
        response = requests.post(
            f'{OLLAMA_BASE_URL}/api/generate',
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({
                'status': 'ok',
                'response': result.get('response', ''),
                'model': model,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({'error': response.text}), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/', methods=['GET'])
def index():
    """Serve setup instructions"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>HPE APEX - Local LLM Server</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
            .success { color: #28a745; }
            .error { color: #dc3545; }
            .warning { color: #ffc107; }
        </style>
    </head>
    <body>
        <h1>🚀 HPE APEX - Local LLM Server</h1>
        <p>Server is running on <code>http://localhost:5000</code></p>
        
        <h2>Setup Instructions</h2>
        <ol>
            <li><strong>Install Ollama:</strong>
                <pre>Download from https://ollama.ai</pre>
            </li>
            <li><strong>Pull a model:</strong>
                <pre>ollama pull mistral
# or try: ollama pull llama2, neural-chat, openchat, etc.</pre>
            </li>
            <li><strong>Start Ollama (if not auto-running):</strong>
                <pre>ollama serve</pre>
            </li>
            <li><strong>Check if server is ready:</strong>
                <pre>curl http://localhost:5000/health</pre>
            </li>
            <li><strong>Open the chatbot:</strong>
                <p>Open <code>HPE-APEX-v3-COMPLETE.html</code> in your browser</p>
                <p>In the API Provider banner, select "Custom / Other" and enter: <code>http://localhost:5000</code></p>
            </li>
        </ol>
        
        <h2>Available Endpoints</h2>
        <ul>
            <li><code>GET /health</code> — Check server and Ollama status</li>
            <li><code>GET /api/models</code> — List available models</li>
            <li><code>POST /api/chat</code> — Chat with the AI (JSON body with "message")</li>
            <li><code>POST /api/generate</code> — Generate text (JSON body with "prompt")</li>
        </ul>
        
        <h2>Recommended Models</h2>
        <ul>
            <li><strong>Mistral 7B</strong> (fast, good quality): <code>ollama pull mistral</code></li>
            <li><strong>Llama 2 7B</strong> (accurate): <code>ollama pull llama2</code></li>
            <li><strong>Neural Chat</strong> (conversational): <code>ollama pull neural-chat</code></li>
            <li><strong>OpenChat</strong> (balanced): <code>ollama pull openchat</code></li>
        </ul>
        
        <h2>Troubleshooting</h2>
        <p><span class="error">Error: Cannot connect to Ollama?</span></p>
        <ul>
            <li>Make sure Ollama is running: <code>ollama serve</code></li>
            <li>Check Ollama is accessible: <code>curl http://localhost:11434/api/tags</code></li>
            <li>Default port is 11434 (change with <code>OLLAMA_URL</code> env var)</li>
        </ul>
        
        <p><span class="warning">Model not found?</span></p>
        <ul>
            <li>Download it first: <code>ollama pull &lt;model-name&gt;</code></li>
            <li>List available: <code>ollama list</code></li>
        </ul>
    </body>
    </html>
    ''', 200, {'Content-Type': 'text/html'}


if __name__ == '__main__':
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║  HPE APEX - Local LLM Server (Ollama Backend)        ║
    ╠═══════════════════════════════════════════════════════╣
    ║  🚀 Server running on http://localhost:5000          ║
    ║  📡 Ollama URL: {:<33} ║
    ║  🤖 Default Model: {:<30} ║
    ║                                                       ║
    ║  1. Make sure Ollama is running: ollama serve       ║
    ║  2. Pull a model: ollama pull mistral               ║
    ║  3. Open HPE-APEX-v3-COMPLETE.html in browser       ║
    ║  4. Use http://localhost:5000 as Custom endpoint    ║
    ║                                                       ║
    ║  Press CTRL+C to stop                               ║
    ╚═══════════════════════════════════════════════════════╝
    """.format(OLLAMA_BASE_URL, DEFAULT_MODEL))
    
    app.run(host='0.0.0.0', port=5000, debug=False)
