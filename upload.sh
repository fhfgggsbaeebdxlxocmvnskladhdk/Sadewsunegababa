#!/bin/bash

clear
echo "========================================================"
echo "🌸 Aira Bot GitHub Auto-Uploader (Sadew Sunera Edition) 🚀"
echo "========================================================"
echo ""

# 1. Check Git
if ! command -v git &> /dev/null; then
    echo "📦 Git install කරමින් පවතී..."
    pkg install git -y
fi

# 2. Collect Credentials
read -p "👤 ඔබගේ GitHub Username එක ඇතුළත් කරන්න: " GH_USER
read -p "📧 ඔබගේ GitHub Email එක ඇතුළත් කරන්න: " GH_EMAIL
read -p "📁 ඔබගේ GitHub Repo එකේ Link එක (e.g. https://github.com/user/repo.git): " REPO_URL
read -p "🔑 ඔබගේ GitHub Personal Access Token එක (ghp_xxxx): " GH_TOKEN

echo ""
echo "🚀 GitHub වෙත Upload කිරීම ආරම්භ කරමින් පවතී..."

# 3. Configure Git
git config --global user.name "$GH_USER"
git config --global user.email "$GH_EMAIL"

# 4. Remove old git if exists and re-init
rm -rf .git
git init
git branch -M main

# 5. Add and Commit
git add .
git commit -m "Upload clean Sadew Aira Bot architecture"

# 6. Push using Token in URL
AUTH_URL=$(echo "$REPO_URL" | sed "s#https://#https://$GH_USER:$GH_TOKEN@#")

git remote add origin "$AUTH_URL"
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================================"
    echo "🎉 සාර්ථකයි සදෙව්! ඔයාගේ Bot Files ඔක්කොම GitHub එකට Upload වුණා! ✨💖"
    echo "========================================================"
else
    echo ""
    echo "❌ Upload එක අසාර්ථක විය. කරුණාකර Repo Link එක සහ Token එක නිවැරදි දැයි බලන්න."
fi