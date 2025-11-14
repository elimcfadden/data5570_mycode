# Fix CORS on EC2

Run this on your EC2 instance to ensure CORS is properly configured:

```bash
cd ~/data5570_mycode
python3 << 'EOF'
import re

# Read settings file
with open('myproject/settings.py', 'r') as f:
    content = f.read()

# Ensure CORS_ALLOW_ALL_ORIGINS is True (for development)
if 'CORS_ALLOW_ALL_ORIGINS = True' not in content:
    # Add CORS settings if not present
    if 'CORS_ALLOW_ALL_ORIGINS' not in content:
        cors_settings = """
# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True
"""
        content = content.rstrip() + cors_settings

print("✅ CORS configuration checked")
with open('myproject/settings.py', 'w') as f:
    f.write(content)
EOF

# Restart Django
screen -S django -X quit 2>/dev/null
cd ~/data5570_mycode
source venv/bin/activate
screen -dmS django bash -c "cd ~/data5570_mycode && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
```

