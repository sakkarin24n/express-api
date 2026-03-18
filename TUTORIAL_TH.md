# Express.js + Prisma + PostgreSQL คู่มือการติดตั้ง

## ความต้องการของระบบ

- **Node.js**: v20+ (โปรเจกต์นี้ใช้ v25.7.0)
- **npm**: v10+ (โปรเจกต์นี้ใช้ v11.11.1)
- **PostgreSQL**: v14+ ติดตั้งและรันอยู่

---

## เวอร์ชันของ Package ที่ใช้

| Package | เวอร์ชัน |
|---------|----------|
| express | ^5.2.1 |
| prisma | ^7.5.0 |
| @prisma/client | ^7.5.0 |
| @prisma/adapter-pg | ^7.5.0 |
| pg | ^8.20.0 |
| dotenv | ^17.3.1 |
| morgan | ^1.10.1 |
| cors | ^2.8.6 |
| nodemon | ^3.1.14 |

---

## โครงสร้างโฟลเดอร์

```
express-new/
├── src/
│   ├── server.js              # จุดเริ่มต้นของแอป
│   ├── lib/
│   │   └── prisma.js          # ตั้งค่า Prisma client
│   ├── middleware/
│   │   ├── logger.js          # บันทึก log การ request
│   │   └── errorHandler.js    # จัดการ error
│   ├── controllers/
│   │   └── userController.js  # การทำงาน CRUD ของ user
│   └── routes/
│       ├── index.js           # โหลด route อัตโนมัติ
│       └── userRoutes.js      # route ของ user
├── prisma/
│   ├── schema.prisma          # โครงสร้างฐานข้อมูล
│   └── config.ts              # ตั้งค่า Prisma
├── .env                       # ตัวแปรสภาพแวดล้อม
└── package.json
```

---

## คำสั่งการติดตั้ง

### 1. เริ่มต้นโปรเจกต์
```bash
npm init -y
```

### 2. ติดตั้ง Dependencies ทั้งหมด
```bash
npm install express dotenv morgan cors
npm install prisma @prisma/client @prisma/adapter-pg pg
npm install -D nodemon
```

### 3. ตั้งค่า Environment
สร้างไฟล์ `.env`:
```
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
```

### 4. เริ่มต้น Prisma
```bash
npx prisma init
```

### 5. ตั้งค่า Prisma

**prisma/schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**prisma.config.ts:**
```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### 6. รัน Migration และ Generate Client
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 7. รัน Server
```bash
npm run dev
```

---

## โค้ดในทุกไฟล์

### src/server.js
```javascript
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import logger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import autoLoadRoutes from './routes/index.js';

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(logger);

autoLoadRoutes(app);

app.get('/', (req, res) => {
  res.send('API Running');
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### src/lib/prisma.js
```javascript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
```

### src/middleware/logger.js
```javascript
const logger = (req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
};

export default logger;
```

### src/middleware/errorHandler.js
```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
  });
};

export default errorHandler;
```

### src/routes/index.js (Auto Loader)
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const autoLoadRoutes = (app) => {
  const routesPath = path.join(__dirname);
  
  fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js') && file !== 'index.js') {
      const routeName = file.replace('.js', '');
      const routePath = `/api/${routeName.replace('Routes', '')}`;
      import(`./${file}`).then((route) => {
        app.use(routePath, route.default);
        console.log(`Route loaded: ${routePath}`);
      });
    }
  });
};

export default autoLoadRoutes;
```

### src/routes/userRoutes.js
```javascript
import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

export default router;
```

### src/controllers/userController.js
```javascript
import prisma from '../lib/prisma.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await prisma.user.create({
      data: { name, email, password },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, password },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    next(error);
  }
};
```

---

## API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | /api/user | ดึงข้อมูล user ทั้งหมด |
| GET | /api/user/:id | ดึงข้อมูล user คนเดียว |
| POST | /api/user | สร้าง user ใหม่ |
| PUT | /api/user/:id | แก้ไข user |
| DELETE | /api/user/:id | ลบ user |

---

## วิธีเพิ่ม Table ใหม่

### ขั้นตอนที่ 1: เพิ่ม Model ใน schema.prisma
```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### ขั้นตอนที่ 2: รัน Migration
```bash
npx prisma migrate dev --name add_post
npx prisma generate
```

---

## วิธีเพิ่ม Route ใหม่

### ขั้นตอนที่ 1: สร้าง Controller
สร้างไฟล์ `src/controllers/postController.js`:
```javascript
import prisma from '../lib/prisma.js';

export const getPosts = async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany();
    res.json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { title, content, published } = req.body;
    const post = await prisma.post.create({
      data: { title, content, published },
    });
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};
```

### ขั้นตอนที่ 2: สร้าง Routes
สร้างไฟล์ `src/routes/postRoutes.js`:
```javascript
import express from 'express';
import { getPosts, createPost } from '../controllers/postController.js';

const router = express.Router();

router.route('/').get(getPosts).post(createPost);

export default router;
```

### ขั้นตอนที่ 3: รีสตาร์ท Server
```bash
npm run dev
```

Route จะถูกโหลดอัตโนมัติที่ `/api/post`.

---

## การตั้งชื่อไฟล์ Route

| ชื่อไฟล์ | API Path |
|---------|----------|
| userRoutes.js | /api/user |
| postRoutes.js | /api/post |
| postsRoutes.js | /api/posts |
| productRoutes.js | /api/product |

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `npm run dev` | รัน development server |
| `npx prisma studio` | เปิด Prisma GUI |
| `npx prisma migrate dev` | สร้าง migration |
| `npx prisma migrate reset` | ลบและสร้างใหม่ทั้งหมด |
| `npx prisma db push` | ส่ง schema ไปที่ฐานข้อมูล |
| `npx prisma generate` | สร้าง Prisma client ใหม่ |

---

## รหัส Error ที่พบบ่อย

| รหัส | คำอธิบาย |
|------|----------|
| P2002 | ข้อมูลซ้ำ (unique constraint) |
| P2025 | ไม่พบข้อมูลที่ต้องการ |

---

## Auto Route Loader ทำงานอย่างไร

ไฟล์ `src/routes/index.js` จะ:

1. อ่านไฟล์ `.js` ทั้งหมดในโฟลเดอร์ `routes`
2. ข้าม `index.js` ตัวมันเอง
3. นำชื่อไฟล์ (เช่น `userRoutes.js`)
4. ลบคำว่า "Routes" ออก → `user`
5. เติม `/api/` ข้างหน้า → `/api/user`
6. โหลด route อัตโนมัติ

**ไม่ต้องแก้ไข server.js เลย!**
