# Git & GitHub Push Guide

## สารบัญ
1. [การตั้งค่าเริ่มต้น](#การตั้งค่าเริ่มต้น)
2. [สร้าง Repository ใหม่](#สร้าง-repository-ใหม่)
3. [Git Commands พื้นฐาน](#git-commands-พื้นฐาน)
4. [การ Push ขึ้น GitHub](#การ-push-ขึ้น-github)
5. [Git Branch](#git-branch)
6. [Gitignore](#gitignore)
7. [.env และ Security](#env-และ-security)

---

## การตั้งค่าเริ่มต้น

### 1. ติดตั้ง Git (ถ้ายังไม่มี)
```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt update
sudo apt install git

# Windows - ดาวน์โหลดจาก https://git-scm.com
```

### 2. ตรวจสอบการติดตั้ง
```bash
git --version
# ควรแสดงเวอร์ชัน เช่น git version 2.40.0
```

### 3. ตั้งค่า Git Config
```bash
# ตั้งชื่อ
git config --global user.name "Your Name"

# ตั้งอีเมล (ต้องตรงกับ GitHub)
git config --global user.email "your.email@example.com"

# ตั้ง editor
git config --global core.editor nano

# ดูการตั้งค่าทั้งหมด
git config --list
```

### 4. Authenticate กับ GitHub CLI
```bash
# ตรวจสอบการ login
gh auth status

# ถ้ายังไม่ได้ login
gh auth login
# เลือก: GitHub.com
# เลือก: HTTPS
# เลือก: Login with a web browser
```

---

## สร้าง Repository ใหม่

### วิธีที่ 1: สร้างบน GitHub.com แล้ว Clone มา

**ขั้นตอนบน GitHub:**
1. ไปที่ https://github.com/new
2. ตั้งชื่อ Repository (เช่น `express-api`)
3. เลือก Public หรือ Private
4. **ไม่ต้อง**ติ๊ก "Add a README"
5. คลิก "Create repository"

**จากนั้น Clone มา:**
```bash
gh repo clone USERNAME/express-api
cd express-api
# คัดลอกไฟล์โปรเจกต์มาวางที่นี่
```

### วิธีที่ 2: ใช้ GitHub CLI สร้างจากโฟลเดอร์ที่มีอยู่
```bash
# อยู่ในโฟลเดอร์โปรเจกต์
cd /path/to/your/project

# สร้าง repo บน GitHub และ push ขึ้นไปเลย
gh repo create express-api --public --source=. --push
```

### วิธีที่ 3: สร้าง Local repo ก่อน แล้วค่อย Push
```bash
# 1. อยู่ในโฟลเดอร์โปรเจกต์
cd /path/to/your/project

# 2. สร้าง local repo
git init

# 3. สร้าง repo บน GitHub
gh repo create express-api --public --source=. --push
```

### วิธีที่ 4: สร้าง Local แล้ว Push ไปที่ Repo ที่สร้างไว้แล้ว
```bash
# 1. อยู่ในโฟลเดอร์โปรเจกต์
cd /path/to/your/project

# 2. สร้าง local repo
git init

# 3. สร้าง remote origin
gh repo create express-api --public

# 4. เพิ่ม remote
git remote add origin https://github.com/USERNAME/express-api.git

# 5. Push ขึ้นไป
git push -u origin main
```

---

## Git Commands พื้นฐาน

### ดูสถานะ
```bash
# ดูสถานะทั้งหมด
git status

# ดูแบบสั้น
git status -s
```

### Staging และ Commit
```bash
# เพิ่มไฟล์ที่แก้ไขทั้งหมด
git add .

# เพิ่มไฟล์เฉพาะ
git add src/server.js

# เพิ่มไฟล์หลายตัว
git add src/ package.json

# Commit พร้อมข้อความ
git commit -m "Add user CRUD API"

# Commit แบบย่อ (stage + commit ในคำสั่งเดียว)
git commit -am "Fix login bug"

# แก้ไข commit ล่าสุด
git commit --amend -m "New commit message"
```

### ดู History
```bash
# ดู commit history
git log

# ดูแบบสั้น
git log --oneline

# ดูการเปลี่ยนแปลงที่ยังไม่ได้ commit
git diff

# ดู staged files
git diff --staged
```

### Undo Actions
```bash
# ยกเลิกการ add (unstage)
git reset

# ยกเลิกไฟล์เฉพาะ
git reset src/app.js

# ยกเลิกการแก้ไขไฟล์ (กลับไปเหมือน commit ล่าสุด)
git checkout -- src/app.js

# หรือ
git restore src/app.js

# ยกเลิก commit ล่าสุด (keep changes ที่ working directory)
git reset --soft HEAD~1

# ยกเลิก commit ล่าสุด (keep changes ที่ working directory, unstage)
git reset HEAD~1

# ยกเลิก commit ล่าสุด (discard changes)
git reset --hard HEAD~1
```

---

## การ Push ขึ้น GitHub

### 1. ตรวจสอบ Branch ปัจจุบัน
```bash
# ดู branch ปัจจุบัน
git branch

# สร้าง branch ใหม่
git branch feature-new-api

# สลับ branch
git checkout feature-new-api

# สร้างและสลับ branch ในคำสั่งเดียว
git checkout -b feature-new-api
```

### 2. เพิ่ม Remote
```bash
# ดู remote ที่มีอยู่
git remote -v

# เพิ่ม remote origin
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# เปลี่ยน remote URL
git remote set-url origin https://github.com/USERNAME/REPO_NAME.git
```

### 3. Push ครั้งแรก (Set Upstream)
```bash
# push branch ปัจจุบันขึ้น origin
git push -u origin main

# หรือถ้าใช้ branch อื่น
git push -u origin feature-new-api
```

### 4. Push ครั้งต่อๆ ไป
```bash
# จาก commit 2 ครั้งขึ้นไป
git push

# push ไป branch ที่ต้องการ
git push origin main

# push ไปทุก branch
git push --all

# push tags
git push --tags
```

---

## Git Branch

### Branch Commands
```bash
# ดู branch ทั้งหมด
git branch

# ดู branch ทั้งหมด (รวม remote)
git branch -a

# สร้าง branch ใหม่
git branch new-feature

# ลบ branch (ที่ local)
git branch -d new-feature

# ลบ branch (ที่ remote)
git push origin --delete old-feature

# เปลี่ยนชื่อ branch
git branch -m old-name new-name
```

### Merge Branch
```bash
# 1. สลับไป branch หลัก
git checkout main

# 2. ดึง code ล่าสุด
git pull origin main

# 3. merge branch ที่ต้องการ
git merge new-feature

# 4. ถ้า conflict ให้แก้ไขแล้ว commit

# 5. push ขึ้นไป
git push origin main
```

### การแก้ Conflict
```bash
# เมื่อ merge แล้วมี conflict
# เปิดไฟล์ที่ conflict จะเห็นแบบนี้:

<<<<<<< HEAD
console.log('your code');
=======
console.log('their code');
>>>>>>> branch-name

# แก้ไขโดยเลือก code ที่ต้องการ หรือรวมทั้งสองอัน

# หลังแก้ไขเสร็จ
git add .
git commit -m "Resolve merge conflict"
```

---

## Gitignore

### หลักการ
```
# ไม่ track ไฟล์ที่ match pattern นี้
*.log

# ไม่ track โฟลเดอร์นี้
node_modules/

# track ไฟล์ที่มีชื่อนี้ (แม้จะ match .gitignore)
!.env.example
```

### .gitignore สำหรับ Node.js/Express
```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# Build
dist/
build/

# Test
coverage/

# Misc
*.tgz
```

### สร้าง .gitignore อัตโนมัติ
```bash
# ใช้เว็บ gitignore.io
# หรือใช้คำสั่ง
npx gitignore node
```

---

## .env และ Security

### หลักการ
```
# ✅ ทำ
- เก็บ .env ไว้ใน .gitignore
- สร้าง .env.example เป็น template
- ใช้ environment variables บน server

# ❌ ไม่ทำ
- commit .env ที่มี password/secret
- commit API keys
- commit database credentials
```

### สร้าง .env.example
```bash
# สร้างไฟล์ template
cp .env .env.example

# แก้ไข .env.example ให้เป็นค่าว่างหรือตัวอย่าง
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
```

### .gitignore สำหรับ .env
```bash
# ขั้นตอนที่ถูกต้อง
1. สร้าง .gitignore มี .env อยู่ด้านใน
2. .env จะไม่ถูก commit
3. คนอื่นใช้ .env.example เป็นตัวอย่าง
```

---

## Workflow การทำงานที่แนะนำ

### กรณีที่ 1: ทำงานคนเดียว
```bash
# 1. Clone repo (ครั้งแรกเท่านั้น)
git clone https://github.com/USERNAME/express-api.git
cd express-api

# 2. สร้าง branch ใหม่
git checkout -b feature/post-api

# 3. แก้ไขโค้ด
# ...

# 4. Commit การเปลี่ยนแปลง
git add .
git commit -m "Add post controller and routes"

# 5. Push ขึ้น branch ตัวเอง
git push -u origin feature/post-api

# 6. ไปสร้าง Pull Request บน GitHub

# 7. หลัง merge แล้ว กลับมาที่ main
git checkout main
git pull origin main

# 8. ลบ branch ที่ merge แล้ว
git branch -d feature/post-api
```

### กรณีที่ 2: ทำงานเป็นทีม
```bash
# 1. ดึง code ล่าสุดก่อนทำงาน
git checkout main
git pull origin main

# 2. สร้าง branch ใหม่จาก main
git checkout -b feature/add-auth

# 3. ทำงาน + commit
git add .
git commit -m "Add JWT authentication"

# 4. Push ขึ้น remote
git push origin feature/add-auth

# 5. สร้าง Pull Request บน GitHub

# 6. รอ code review + merge
```

---

## GitHub CLI (gh) Commands

```bash
# ตรวจสอบ login
gh auth status

# สร้าง repository
gh repo create my-project --public

# Clone repository
gh repo clone USERNAME/my-project

# สร้าง Pull Request
gh pr create --title "Add new feature" --body "Description"

# ดู Pull Requests
gh pr list

# Merge Pull Request
gh pr merge PR_NUMBER

# ดู repo info
gh repo view

# Sync fork (ถ้า fork มาจากคนอื่น)
git remote add upstream https://github.com/ORIGINAL/REPO.git
git fetch upstream
git checkout main
git merge upstream/main
```

---

## คำสั่งย่อที่ใช้บ่อย

| คำสั่ง | คำเต็ม |
|--------|--------|
| `git s` | `git status -s` |
| `git co` | `git checkout` |
| `git br` | `git branch` |
| `git ci` | `git commit` |
| `git unstage` | `git reset HEAD --` |
| `git last` | `git log -1 HEAD` |
| `git d` | `git diff` |

### ตั้งค่า alias
```bash
git config --global alias.s "status -s"
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage "reset HEAD --"
```

---

## Troubleshooting

### Push ถูก Reject
```bash
# เพราะ remote มี commit ใหม่กว่า local
git pull --rebase origin main
git push origin main
```

### ลืมเพิ่ม .gitignore ก่อน commit
```bash
# ลบไฟล์จาก git cache
git rm -r --cached .
git add .
git commit -m "Remove ignored files"

# หรือลบไฟล์เฉพาะ
git rm -r --cached node_modules/
git commit -m "Remove node_modules from tracking"
```

### ต้องการยกเลิก commit ที่ push ไปแล้ว
```bash
# ยกเลิก commit ล่าสุด
git revert HEAD

# Push การ revert ขึ้นไป
git push origin main
```

### ต้องการ force push
```bash
# ⚠️ ใช้ด้วยความระวัง! จะเขียนทับ remote
git push --force origin main

# ปลอดภัยกว่า
git push --force-with-lease origin main
```

---

## สรุป Workflow

```
1. git clone / git init
        ↓
2. แก้ไขโค้ด
        ↓
3. git add .
        ↓
4. git commit -m "message"
        ↓
5. git push / git push -u origin branch
        ↓
6. สร้าง Pull Request บน GitHub (ถ้าทำเป็นทีม)
        ↓
7. Merge Pull Request
```
