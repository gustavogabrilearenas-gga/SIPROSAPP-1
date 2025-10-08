#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick Fix Script - Creates .env.dev and runs migrations
Run this script to quickly set up your development environment
"""

import os
import sys
import subprocess
from pathlib import Path

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"\n-> {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        print(f"[OK] {description} - Success")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} - Failed")
        if e.stderr:
            print(f"Error: {e.stderr}")
        return False

def create_env_file():
    """Create .env.dev file"""
    env_content = """# SIPROSA MES - Development Environment
ENVIRONMENT=development
DEBUG=True
DB_NAME=siprosa_mes
DB_USER=siprosa_user
DB_PASSWORD=siprosa_pass_123
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=django-insecure-dev-key-change-in-production-123456789
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000,http://127.0.0.1:3000
"""
    
    env_file = Path('.env.dev')
    if not env_file.exists():
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print("[OK] Created .env.dev file")
    else:
        print("[OK] .env.dev already exists")

def main():
    print("=" * 60)
    print("SIPROSA MES - Quick Fix Script")
    print("=" * 60)
    
    # Create env file
    print("\n[1/3] Setting up environment file...")
    create_env_file()
    
    # Run migrations
    print("\n[2/3] Running database migrations...")
    if not run_command("python manage.py migrate", "Database migration"):
        print("\n[WARNING] Migration failed. Make sure:")
        print("   1. Virtual environment is activated")
        print("   2. PostgreSQL is running (or the system will use SQLite)")
        return
    
    # Collect static files
    print("\n[3/3] Collecting static files...")
    run_command("python manage.py collectstatic --no-input", "Static files collection")
    
    print("\n" + "=" * 60)
    print("[OK] Setup Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Create a superuser:")
    print("   python manage.py createsuperuser")
    print("\n2. Start the server:")
    print("   python manage.py runserver")
    print("\n3. Access the admin panel:")
    print("   http://localhost:8000/admin/")
    print("=" * 60)

if __name__ == "__main__":
    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("[WARNING] Virtual environment might not be activated")
        print("   Run: venv\\Scripts\\activate (Windows) or source venv/bin/activate (Linux/Mac)")
        response = input("\nContinue anyway? (y/N): ")
        if response.lower() != 'y':
            sys.exit(0)
    
    main()

