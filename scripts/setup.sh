#!/bin/bash

echo "🤖 ClawdBot Environment Setup"
echo "=============================="

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping .env creation"
        exit 0
    fi
fi

# Copy example file
echo "Creating .env from .env.example..."
cp .env.example .env

echo ""
echo "✅ .env file created!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env with your credentials:"
echo "   nano .env"
echo ""
echo "2. Fill in at minimum:"
echo "   - TWILIO_ACCOUNT_SID (from Twilio Console)"
echo "   - TWILIO_AUTH_TOKEN (from Twilio Console)"
echo "   - TWILIO_WHATSAPP_FROM (your Twilio WhatsApp number)"
echo ""
echo "3. Optional: Add API keys for AI features"
echo ""
echo "4. Install dependencies:"
echo "   pnpm install"
echo ""
echo "5. Run the bot:"
echo "   pnpm dev"
echo ""

# Set secure permissions
chmod 600 .env
echo "🔒 Set .env permissions to 600 (secure)"