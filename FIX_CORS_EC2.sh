#!/bin/bash
# Fix CORS on EC2 Django

cd ~/data5570_mycode

python3 << 'PYTHON'
import re

# Read settings file
with open('myproject/settings.py', 'r') as f:
    content = f.read()

# Ensure corsheaders is in INSTALLED_APPS
if "'corsheaders'" not in content:
    content = content.replace(
        "    'rest_framework',\n    'customers',",
        "    'rest_framework',\n    'corsheaders',\n    'customers',"
    )
    print("✅ Added corsheaders to INSTALLED_APPS")

# Ensure CORS middleware is first
if "'corsheaders.middleware.CorsMiddleware'" not in content:
    content = content.replace(
        "MIDDLEWARE = [\n    'django.middleware.security.SecurityMiddleware',",
        "MIDDLEWARE = [\n    'corsheaders.middleware.CorsMiddleware',\n    'django.middleware.security.SecurityMiddleware',"
    )
    print("✅ Added CORS middleware")

# Ensure CORS_ALLOW_ALL_ORIGINS is True
if 'CORS_ALLOW_ALL_ORIGINS' not in content:
    cors_settings = """
# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
"""
    content = content.rstrip() + cors_settings
    print("✅ Added CORS settings")
elif 'CORS_ALLOW_ALL_ORIGINS = False' in content or 'CORS_ALLOW_ALL_ORIGINS = True' not in content:
    content = re.sub(
        r'CORS_ALLOW_ALL_ORIGINS = .*',
        'CORS_ALLOW_ALL_ORIGINS = True',
        content
    )
    print("✅ Updated CORS_ALLOW_ALL_ORIGINS to True")

# Write back
with open('myproject/settings.py', 'w') as f:
    f.write(content)

print("\n✅ CORS configuration updated!")
PYTHON

echo ""
echo "Restarting Django..."
screen -S django -X quit 2>/dev/null
sleep 2
cd ~/data5570_mycode
source venv/bin/activate
screen -dmS django bash -c "cd ~/data5570_mycode && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
sleep 3
echo "✅ Django restarted with CORS configuration!"

