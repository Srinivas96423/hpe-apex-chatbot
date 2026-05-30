# HPE APEX - AI Chatbot with Local LLM (No API Required) 🚀

Your professional-grade AI assistant for HPE server hardware, Broadcom controllers, and intelligent issue diagnosis — **running 100% locally without any external APIs**.

![Status](https://img.shields.io/badge/status-active-success) ![Python](https://img.shields.io/badge/python-3.8+-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 What You Get

✅ **Proper AI Responses** - Uses real open-source LLMs (Mistral, Llama2, etc.)  
✅ **Zero API Costs** - Everything runs locally on your machine  
✅ **Full Privacy** - Your data never leaves your computer  
✅ **Offline Capable** - Works without internet connection  
✅ **HPE Expert Knowledge** - Specialized for server troubleshooting  
✅ **Beautiful UI** - Modern dark-themed chatbot interface  
✅ **Multi-Model Support** - Switch between different LLMs easily  

---

## 📋 Quick Start (5 Minutes)

### Step 1: Install Ollama
Download and install **Ollama** (the local LLM server):
- **macOS**: https://ollama.ai/download/Ollama-darwin.zip
- **Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`
- **Windows**: https://ollama.ai/download/OllamaSetup.exe

### Step 2: Pull a Model
Open terminal and download a model:

```bash
# Recommended (4GB, fast, good quality)
ollama pull mistral

# Or try these alternatives:
ollama pull llama2           # 7GB, more accurate
ollama pull neural-chat      # 3GB, conversational
ollama pull openchat         # 3.5GB, balanced
```

### Step 3: Start Ollama
```bash
ollama serve
# Ollama now runs on http://localhost:11434
```

### Step 4: Install Python Backend
```bash
# Clone the repo or download files
git clone <this-repo>
cd hpe-apex-chatbot

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python server.py
# Server runs on http://localhost:5000
```

### Step 5: Open Chatbot
1. Open **HPE-APEX-v3-COMPLETE.html** in your web browser
2. In the top banner, select **"Custom / Other"** from the provider dropdown
3. In the Model field, enter: `http://localhost:5000`
4. Click **CONNECT**
5. Start chatting! 🎉

---

## 📁 Project Structure

```
hpe-apex-chatbot/
├── HPE-APEX-v3-COMPLETE.html    # Main chatbot UI (open in browser)
├── server.py                     # Flask backend (Python)
├── llm-client.js                 # JavaScript client library
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file (optional):

```bash
# Default model to use
DEFAULT_MODEL=mistral

# Ollama server URL (if not default)
OLLAMA_URL=http://localhost:11434

# Flask server port
FLASK_PORT=5000
```

### Changing Models
- In the **Model** field of the chatbot banner, type the model name
- Available models: `mistral`, `llama2`, `neural-chat`, `openchat`, etc.
- List all installed models: `ollama list`

---

## 🎓 Usage Examples

### Via Browser (Easiest)
1. Connect to `http://localhost:5000`
2. Ask: *"Compare Broadcom MR932i-p vs MR216i-a controllers"*
3. Get instant, detailed response with expert analysis

### Via curl (API Testing)
```bash
# Check if server is running
curl http://localhost:5000/health

# Get available models
curl http://localhost:5000/api/models

# Chat with AI
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is RAID 5?",
    "model": "mistral",
    "temperature": 0.7
  }'
```

---

## 📊 API Reference

### Health Check
```http
GET /health
```
Returns: Server and Ollama status

### Get Models
```http
GET /api/models
```
Returns: List of available models

### Chat Endpoint
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Your question here",
  "model": "mistral",
  "temperature": 0.7,
  "top_p": 0.9
}
```

### Generate Endpoint
```http
POST /api/generate
Content-Type: application/json

{
  "prompt": "Your prompt here",
  "model": "mistral",
  "temperature": 0.7
}
```

---

## 🚨 Troubleshooting

### Error: "Cannot connect to Ollama"
```bash
# Make sure Ollama is running
ollama serve

# Test connection
curl http://localhost:11434/api/tags
```

### Error: "Model not found"
```bash
# Pull the model first
ollama pull mistral

# List installed models
ollama list
```

### Error: "Request timeout"
- Your LLM is taking too long (CPU inference is slow)
- Use a smaller model: `neural-chat` or `openchat`
- Or add more RAM/GPU

### Port Already in Use
```bash
# Check what's using port 5000
lsof -i :5000

# Use different port
FLASK_PORT=5001 python server.py
```

### JavaScript Errors in Browser Console
- Make sure server is running on `http://localhost:5000`
- Check CORS headers are being sent
- Try refreshing the page

---

## 🎨 Customization

### Change System Prompt
Edit `server.py`, modify the `SYSTEM_PROMPT` variable:

```python
SYSTEM_PROMPT = """Your custom instructions here..."""
```

### Add More Models
In `llm-client.js`, update `PROVIDER_MODELS`:

```javascript
const PROVIDER_MODELS = {
  anthropic: 'claude-3-sonnet-20240229',
  openai: 'gpt-4-turbo',
  // Add your custom model here
  custom_provider: 'your-model-name'
};
```

### Modify UI Theme
Edit CSS in `HPE-APEX-v3-COMPLETE.html`:

```css
:root {
  --hpe-green: #01A982;      /* Main color */
  --bg-deep: #05080D;         /* Background */
  --text-primary: #E8F4F0;    /* Text color */
}
```

---

## 📈 Performance Tips

| Scenario | Recommended Model | RAM Required | Speed |
|----------|------------------|--------------|-------|
| **Fast responses** | `mistral` | 4GB | ⚡ ~5-10 sec |
| **Better quality** | `llama2` | 8GB | 🔄 ~10-20 sec |
| **Conversational** | `neural-chat` | 4GB | ⚡ ~5-10 sec |
| **CPU only** | `openchat` | 4GB | 🔄 ~8-15 sec |

**Pro Tips:**
- Use GPU acceleration if available (faster responses)
- Mistral 7B is the best balance of speed & quality
- Larger models give better answers but take longer

---

## 🔐 Security & Privacy

✅ **Your data is private:**
- All processing happens locally on your machine
- No requests sent to cloud services
- No API keys needed for local models
- Complete control over data

⚠️ **Considerations:**
- Models are large (3-13GB each)
- Inference is CPU/GPU intensive
- First response might be slower (model loading)

---

## 📚 Supported HPE Topics

The system prompt includes expertise in:
- **HPE ProLiant Servers** (Gen10, Gen11)
- **Broadcom MegaRAID Controllers** (MR932i-p, MR216i-a, etc.)
- **Microchip SmartRAID** Controllers
- **HPE Smart Array** Controllers
- **iLO 5/6** Management
- **RAID Configuration** & Troubleshooting
- **Drive Diagnostics** & LED Indicators
- **Storage Networking** & Protocol Tuning
- **Firmware Updates** & Patching
- **Performance Optimization**

---

## 🛠️ Advanced Setup (Docker)

### Run Server in Docker
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY server.py .

EXPOSE 5000
CMD ["python", "server.py"]
```

Build and run:
```bash
docker build -t hpe-apex .
docker run -p 5000:5000 -e OLLAMA_URL=http://host.docker.internal:11434 hpe-apex
```

---

## 📝 FAQ

**Q: Do I need an API key?**  
A: No! Everything runs locally. No API keys required.

**Q: Can I use cloud APIs too?**  
A: Yes, the code is structured to support both local and cloud APIs (coming soon).

**Q: How much disk space do I need?**  
A: ~5-15GB depending on which models you download.

**Q: Can I run this on Windows?**  
A: Yes! Ollama supports Windows. Python works on all platforms.

**Q: Is the UI mobile-friendly?**  
A: Yes, the chatbot is responsive and works on phones/tablets.

**Q: Can I use this without internet?**  
A: Yes! Once models are downloaded, everything works offline.

---

## 🤝 Contributing

Found a bug or want to improve the chatbot?
- Fork the repo
- Make your changes
- Submit a pull request

---

## 📜 License

MIT License - feel free to use and modify for your needs.

---

## 🔗 Resources

- **Ollama**: https://ollama.ai
- **Available Models**: https://ollama.ai/library
- **Mistral Docs**: https://docs.mistral.ai
- **Llama2 Docs**: https://llama.meta.com

---

## 📞 Support

Having issues? Check the **Troubleshooting** section above or:
1. Verify Ollama is running: `curl http://localhost:11434/api/tags`
2. Check Flask server: `curl http://localhost:5000/health`
3. Review browser console for JavaScript errors
4. Check Python server logs for backend errors

---

**Made with ❤️ for HPE Server Professionals**

Start chatting with your AI expert now! 🎯
