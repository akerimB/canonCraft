# Configuration Setup

## Secure API Key Configuration

This project uses a secure configuration system to keep your API keys safe and out of version control.

### Setup Instructions

1. **Copy the template configuration file:**
   ```bash
   cp config.example.js config.js
   ```

2. **Edit `config.js` with your actual API keys:**
   ```javascript
   export const OPENAI_CONFIG = {
     API_KEY: 'sk-your-actual-openai-api-key-here',
     MODEL: 'gpt-4o-mini'
   };
   ```

3. **Never commit `config.js` to version control:**
   - The file is already in `.gitignore`
   - Only commit `config.example.js` as a template

### Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it into your `config.js` file

### Security Best Practices

- ✅ **DO**: Keep `config.js` in `.gitignore`
- ✅ **DO**: Use `config.example.js` as a template
- ✅ **DO**: Share setup instructions, not actual keys
- ❌ **DON'T**: Commit real API keys to GitHub
- ❌ **DON'T**: Share API keys in chat/email
- ❌ **DON'T**: Hardcode keys in source files

### File Structure

```
project/
├── config.js          # Your actual API keys (gitignored)
├── config.example.js   # Template (safe to commit)
├── aiService.js        # Uses keys from config.js
└── services/
    └── aiService.js    # Uses keys from config.js
```

This approach ensures your API keys stay secure while allowing you to safely commit your code to GitHub! 