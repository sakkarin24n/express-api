# HOW_CODE_WORK.md - คู่มือการทำงานของโค้ดแบบละเอียด

## สารบัญ
1. [ภาพรวมการทำงาน](#overview)
2. [Flow การทำงาน](#flow)
3. [Step by Step](#step-by-step)
4. [รายละเอียดแต่ละไฟล์](#file-details)
5. [Middleware คืออะไร](#middleware)
6. [Auto Route Loader ทำงานอย่างไร](#auto-route-loader)
7. [Prisma ทำงานอย่างไร](#prisma)

---

## ภาพรวมการทำงาน {#overview}

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser/Postman)                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP Request
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      src/server.js                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Middleware │──▶│ Auto Loader  │──▶│ Route Handler          │  │
│  │ - morgan   │  │ (index.js)   │  │ - userRoutes.js        │  │
│  │ - logger   │  │              │  │                        │  │
│  └─────────────┘  └──────────────┘  └──────────┬───────────────┘  │
└─────────────────────────────────────────────────┼─────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    src/controllers/                             │
│                    userController.js                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ getUsers, getUserById, createUser, updateUser, deleteUser │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      src/lib/prisma.js                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PrismaClient ←── pg Pool ←── PostgreSQL Database          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow การทำงาน {#flow}

เมื่อ client ส่ง request เข้ามา เช่น `GET /api/user` จะเกิดขั้นตอนดังนี้:

```
1. Request เข้ามา
        │
        ▼
2. express.json() middleware อ่าน body ที่ส่งมา
        │
        ▼
3. morgan('dev') พิมพ์ log การ request
        │
        ▼
4. logger middleware พิมพ์ timestamp + method + path
        │
        ▼
5. autoLoadRoutes() ตรวจสอบ path แล้วส่งไปที่ userRoutes.js
        │
        ▼
6. userRoutes.js จับคู่ route → เรียก getUsers ใน controller
        │
        ▼
7. userController.js รัน prisma.user.findMany()
        │
        ▼
8. prisma.js ส่ง SQL query ไปที่ PostgreSQL
        │
        ▼
9. PostgreSQL ดึงข้อมูล และส่งกลับมา
        │
        ▼
10. Controller แปลงข้อมูลเป็น JSON แล้วส่ง response
        │
        ▼
11. ถ้ามี error → errorHandler จัดการ
```

---

## Step by Step

### การเริ่มต้น Server

เมื่อพิมพ์ `npm run dev` จะเกิดเหตุการณ์ดังนี้:

```javascript
// src/server.js
import 'dotenv/config';              // 1. โหลดตัวแปรจาก .env
import express from 'express';         // 2. นำเข้า express framework
import morgan from 'morgan';           // 3. นำเข้า morgan (HTTP logger)
import logger from './middleware/logger.js';           // 4. นำเข้า logger
import errorHandler from './middleware/errorHandler.js'; // 5. นำเข้า error handler
import autoLoadRoutes from './routes/index.js';        // 6. นำเข้า auto loader

const app = express();  // 7. สร้าง express app

// 8. ตั้งค่า Middleware ทั้งหมด
app.use(express.json());  // แปลง JSON body เป็น object
app.use(morgan('dev'));   // พิมพ์ HTTP log
app.use(logger);          // พิมพ์ timestamp log

// 9. โหลด routes ทั้งหมดโดยอัตโนมัติ
autoLoadRoutes(app);

// 10. สร้าง route หลัก
app.get('/', (req, res) => {
  res.send('API Running');
});

// 11. กำหนด error handler
app.use(errorHandler);

// 12. สตาร์ทเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### การทำงานของ Middleware

**Middleware คือฟังก์ชันที่ทำงานก่อน request จะถึง route handler**

```
Request ──▶ express.json() ──▶ morgan() ──▶ logger() ──▶ Router ──▶ Response
           (parse JSON)      (HTTP log)   (timestamp)
```

#### 1. express.json()
```javascript
app.use(express.json());
```
- ทำหน้าที่อ่าน JSON ที่ส่งมาใน body
- แปลงจาก string เป็น JavaScript object
- เก็บไว้ใน `req.body`

**ตัวอย่าง:**
```
POST /api/user
Body: { "name": "John", "email": "john@test.com" }

↓ express.json() ทำงาน

req.body = { name: "John", email: "john@test.com" }
```

#### 2. morgan('dev')
```javascript
app.use(morgan('dev'));
```
- พิมพ์ HTTP log แบบ dev format
- ตัวอย่าง output:
```
GET /api/user 200 3.521 ms - 156
POST /api/user 201 5.123 ms - 89
```

#### 3. logger (custom middleware)
```javascript
// src/middleware/logger.js
const logger = (req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
};

export default logger;
```

- พิมพ์ timestamp + HTTP method + path
- ตัวอย่าง output:
```
2026-03-18T13:45:30.123Z | GET /api/user
2026-03-18T13:45:35.456Z | POST /api/user
```

**สำคัญ:** ต้องเรียก `next()` เพื่อให้ request ไปต่อ

---

## รายละเอียดแต่ละไฟล์ {#file-details}

### 1. src/server.js - จุดเริ่มต้นทั้งหมด

```javascript
import 'dotenv/config';
```

**ทำงาน:** โหลด environment variables จากไฟล์ `.env` เข้าสู่ `process.env`

**ไฟล์ .env:**
```
PORT=3000
DATABASE_URL="postgresql://..."
```

**หลังจาก import:** สามารถใช้ `process.env.PORT` ได้เลย

---

### 2. src/lib/prisma.js - การเชื่อมต่อฐานข้อมูล

```javascript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// สร้าง connection pool ไปยัง PostgreSQL
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// สร้าง Prisma adapter ด้วย pool
const adapter = new PrismaPg(pool);

// สร้าง PrismaClient ที่ใช้ adapter
const prisma = new PrismaClient({ adapter });

export default prisma;
```

**ทำไมต้องใช้ Adapter?**
```
Prisma 7+ ต้องการ adapter สำหรับเชื่อมต่อ database โดยตรง
Adapter ทำหน้าที่เป็นตัวเชื่อมระหว่าง Prisma กับ pg library
```

**โครงสร้างการเชื่อมต่อ:**
```
┌──────────────┐     ┌─────────────┐     ┌────────────┐
│   Express    │────▶│   Prisma    │────▶│  pg Pool   │
│   (เรา)      │     │   Client    │     │  (Pool)    │
└──────────────┘     └─────────────┘     └────────────┘
                                              │
                                              ▼
                                         ┌────────────┐
                                         │ PostgreSQL │
                                         └────────────┘
```

---

### 3. src/middleware/logger.js - บันทึก log

```javascript
const logger = (req, res, next) => {
  // req = request object (ข้อมูลที่ client ส่งมา)
  // res = response object (ใช้ตอบกลับ client)
  // next = ฟังก์ชันเรียกต่อ (ส่งต่อไป middleware/route ถัดไป)
  
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  // Output: 2026-03-18T13:45:30.123Z | GET /api/user
  
  next(); // บอกว่าทำเสร็จแล้ว ไปต่อได้
};

export default logger;
```

**req object มีข้อมูลอะไรบ้าง:**
| Property | คำอธิบาย | ตัวอย่าง |
|----------|---------|----------|
| req.method | HTTP method | GET, POST, PUT, DELETE |
| req.path | URL path | /api/user/1 |
| req.body | JSON body ที่ส่งมา | { name: "John" } |
| req.params | URL parameters | { id: "1" } |
| req.query | Query string | ?page=1&limit=10 |
| req.headers | HTTP headers | Content-Type, Authorization |

---

### 4. src/middleware/errorHandler.js - จัดการ error

```javascript
const errorHandler = (err, req, res, next) => {
  // err = error object ที่เกิดขึ้น
  
  console.error(err.stack); // พิมพ์ stack trace ของ error
  
  res.status(err.statusCode || 500).json({ // ส่ง status code
    success: false,
    error: err.message || 'Server Error',
  });
};

export default errorHandler;
```

**วิธีการทำงาน:**
```
เมื่อ controller หรือ route มี error และเรียก next(error):
        
        ↓
┌───────────────────────────────────────┐
│  ถ้าเรียก next(error) หรือ throw error │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  express จะข้าม route ทั้งหมดไป      │
│  แล้วมาที่ errorHandler              │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  errorHandler ส่ง error response กลับ │
└───────────────────────────────────────┘
```

**การใช้งานใน Controller:**
```javascript
export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({...});
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
      // ไม่ต้อง next() เพราะ return อยู่แล้ว
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error); // ส่ง error ไปที่ errorHandler
  }
};
```

---

### 5. src/routes/index.js - Auto Route Loader

นี่คือหัวใจของระบบ auto-loading!

```javascript
import fs from 'fs';                    // 1. ใช้อ่านไฟล์ในโฟลเดอร์
import path from 'path';
import { fileURLToPath } from 'url';

// 2. หา path ปัจจุบัน (จำเป็นสำหรับ ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. ฟังก์ชัน auto load routes
const autoLoadRoutes = (app) => {
  const routesPath = path.join(__dirname); // path/to/src/routes
  
  // 4. อ่านไฟล์ทั้งหมดในโฟลเดอร์ routes
  fs.readdirSync(routesPath).forEach((file) => {
    // 5. ข้าม index.js และเฉพาะไฟล์ .js
    if (file.endsWith('.js') && file !== 'index.js') {
      
      // 6. สร้าง URL path
      // userRoutes.js → /api/user
      const routeName = file.replace('.js', ''); // "userRoutes"
      const routePath = `/api/${routeName.replace('Routes', '')}`; // "/api/user"
      
      // 7. import route file แบบ dynamic
      import(`./${file}`).then((route) => {
        // 8. mount route บน app
        app.use(routePath, route.default);
        console.log(`Route loaded: ${routePath}`);
      });
    }
  });
};

export default autoLoadRoutes;
```

**ขั้นตอนการทำงาน:**

```
ถ้าในโฟลเดอร์ src/routes/ มีไฟล์:
├── index.js           ← ข้าม
├── userRoutes.js      ← โหลด
└── postRoutes.js       ← โหลด

Step 1: อ่านไฟล์ทั้งหมด
        ↓
Step 2: ข้าม index.js
        ↓
Step 3: สำหรับ userRoutes.js:
        - file = "userRoutes.js"
        - routeName = "userRoutes"
        - routePath = "/api/" + "userRoutes".replace("Routes", "") = "/api/user"
        ↓
Step 4: import('./userRoutes.js')
        ↓
Step 5: app.use('/api/user', importedRouter)
        ↓
Step 6: console.log("Route loaded: /api/user")
```

---

### 6. src/routes/userRoutes.js - Route Definitions

```javascript
import express from 'express';
import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/userController.js';

const router = express.Router();

// GET /api/user      → getUsers
// POST /api/user     → createUser
router.route('/').get(getUsers).post(createUser);

// GET /api/user/:id  → getUserById
// PUT /api/user/:id → updateUser
// DELETE /api/user/:id → deleteUser
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

export default router;
```

**Router ทำงานอย่างไร:**

```
Request: GET /api/user/5

app.use('/api/user', userRoutes)
        │
        ├── path = '/api/user' ตรงกับ prefix
        │
        ▼
router จะ strip prefix ออก เหลือแค่ '/5'
        │
        ▼
router.route('/:id').get(getUserById)
        │
        ├── '/5' ตรงกับ '/:id'
        │
        ▼
เรียก getUserById(req, res, next)
        │
        ▼
req.params = { id: '5' }
```

**ความแตกต่างระหว่าง params, query, body:**

```
URL: GET /api/user/5?page=1&sort=name

req.params  = { id: '5' }           // URL parameters (path)
req.query  = { page: '1', sort: 'name' }  // Query string (?)
req.body   = {}                     // JSON body (POST/PUT)
```

---

### 7. src/controllers/userController.js - Business Logic

```javascript
import prisma from '../lib/prisma.js';

// 1. GET /api/user - ดึงข้อมูลทั้งหมด
export const getUsers = async (req, res, next) => {
  try {
    // ดึงข้อมูลจาก Prisma
    const users = await prisma.user.findMany({
      // เลือกเฉพาะ field ที่ต้องการ (ไม่ดึง password)
      select: { 
        id: true, 
        name: true, 
        email: true, 
        createdAt: true 
      },
    });
    
    // ส่ง response กลับ
    res.json({ success: true, data: users });
    
  } catch (error) {
    next(error); // ถ้ามี error ส่งไปให้ errorHandler
  }
};

// 2. GET /api/user/:id - ดึงข้อมูล 1 คน
export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) }, // หาจาก id
      select: { id: true, name: true, email: true, createdAt: true },
    });
    
    // ถ้าไม่พบ user
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({ success: true, data: user });
    
  } catch (error) {
    next(error);
  }
};

// 3. POST /api/user - สร้าง user ใหม่
export const createUser = async (req, res, next) => {
  try {
    // รับข้อมูลจาก body
    const { name, email, password } = req.body;
    
    // สร้าง user ใหม่
    const user = await prisma.user.create({
      data: { name, email, password },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    
    // ส่งกลับพร้อม status 201 (Created)
    res.status(201).json({ success: true, data: user });
    
  } catch (error) {
    // ถ้า email ซ้ำ (unique constraint)
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    next(error);
  }
};

// 4. PUT /api/user/:id - อัพเดท user
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
    // ถ้าไม่พบ user ที่จะอัพเดท
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    next(error);
  }
};

// 5. DELETE /api/user/:id - ลบ user
export const deleteUser = async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    });
    
    res.json({ success: true, message: 'User deleted' });
    
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    next(error);
  }
};
```

---

## Middleware คืออะไร {#middleware}

### แนวคิดของ Middleware

```
Middleware = ซอฟต์แวร์ที่อยู่ระหว่าง request และ response

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Request    │────▶│  Middleware  │────▶│  Middleware  │────▶ ...
│   (req)      │     │     #1       │     │     #2       │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Response   │◀────│    Route     │◀────
                     │   (res)      │     │   Handler    │
                     └──────────────┘     └──────────────┘
```

### วิธีการสร้าง Middleware

```javascript
// 1. สร้างไฟล์ใน middleware/
// src/middleware/auth.js

const auth = (req, res, next) => {
  // ดึง token จาก header
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'No token provided' 
    });
  }
  
  // ตรวจสอบ token...
  // ถ้าผ่าน
  next(); // ไปต่อ
  // ถ้าไม่ผ่าน
  // res.status(401).json({...}); // ไม่ต้อง next()
};

export default auth;
```

### วิธีการใช้ Middleware

```javascript
// ใช้กับ route เดียว
app.get('/admin', auth, (req, res) => {
  res.send('Admin Panel');
});

// ใช้กับ route ที่ขึ้นต้นด้วย /admin
app.use('/admin', auth);
```

---

## Auto Route Loader ทำงานอย่างไร {#auto-route-loader}

### ปัญหาก่อนใช้ Auto Loader

```javascript
// ต้องมาเขียน manual ทุกครั้งที่เพิ่ม route ใหม่
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const orderRoutes = require('./routes/orderRoutes');
// ... เพิ่มทุกครั้ง

app.use('/api/user', userRoutes);
app.use('/api/post', postRoutes);
app.use('/api/order', orderRoutes);
// ... เพิ่มทุกครั้ง
```

### วิธีแก้ด้วย Auto Loader

```javascript
// แค่เรียกฟังก์ชันเดียว
autoLoadRoutes(app);

// เพิ่มไฟล์ใหม่ใน routes/ ก็จะ auto-load!
```

### ขั้นตอนการทำงานแบบละเอียด

```javascript
// Step 1: อ่านไฟล์ทั้งหมดใน routes/
fs.readdirSync(routesPath)
// ผลลัพธ์: ['index.js', 'userRoutes.js', 'postRoutes.js']

// Step 2: วนลูปแต่ละไฟล์
['index.js', 'userRoutes.js', 'postRoutes.js'].forEach((file) => {
  
  // Step 3: กรองเฉพาะ .js และไม่ใช่ index.js
  if (file.endsWith('.js') && file !== 'index.js') {
    // file = 'userRoutes.js'
    
    // Step 4: ตัด .js ออก
    const routeName = file.replace('.js', ''); // 'userRoutes'
    
    // Step 5: ตัด 'Routes' ออก
    const cleanName = routeName.replace('Routes', ''); // 'user'
    
    // Step 6: เติม /api/ ข้างหน้า
    const routePath = `/api/${cleanName}`; // '/api/user'
    
    // Step 7: Dynamic import
    import('./userRoutes.js').then((route) => {
      // route = { default: router }
      
      // Step 8: Mount route
      app.use(routePath, route.default);
      // app.use('/api/user', userRouter)
    });
  }
});
```

### ตารางสรุปการแปลงชื่อไฟล์เป็น Path

| ไฟล์ใน routes/ | ขั้นตอน | API Path |
|----------------|--------|----------|
| userRoutes.js | userRoutes → user → /api/user | /api/user |
| postRoutes.js | postRoutes → post → /api/post | /api/post |
| postsRoutes.js | postsRoutes → posts → /api/posts | /api/posts |
| productRoutes.js | productRoutes → product → /api/product | /api/product |

---

## Prisma ทำงานอย่างไร {#prisma}

### 1. Schema → Database

```
prisma/schema.prisma
┌─────────────────────────────────────┐
│ model User {                        │
│   id        Int      @id @default() │
│   name      String                   │
│   email     String   @unique        │
│   password  String                   │
│   createdAt DateTime @default(now())│
│ }                                   │
└─────────────────────────────────────┘
              │
              │ npx prisma migrate dev
              ▼
PostgreSQL Database
┌─────────────────────────────────────┐
│ CREATE TABLE "User" (               │
│   id        SERIAL PRIMARY KEY,     │
│   name      TEXT NOT NULL,          │
│   email     TEXT UNIQUE NOT NULL,   │
│   password  TEXT NOT NULL,          │
│   createdAt TIMESTAMP DEFAULT now() │
│ );                                  │
└─────────────────────────────────────┘
```

### 2. Prisma Client → SQL Query

```javascript
// เรียก Prisma method
await prisma.user.findMany()

// Prisma แปลงเป็น SQL
SELECT id, name, email, "createdAt" FROM "User";
```

### 3. ตัวอย่าง Prisma Methods

```javascript
// ดึงทั้งหมด
await prisma.user.findMany()

// ดึง 1 รายการ
await prisma.user.findUnique({ where: { id: 1 } })

// สร้างใหม่
await prisma.user.create({ data: { name: "John", email: "john@test.com", password: "123" } })

// อัพเดท
await prisma.user.update({ where: { id: 1 }, data: { name: "Jane" } })

// ลบ
await prisma.user.delete({ where: { id: 1 } })

// ค้นหา
await prisma.user.findMany({ where: { name: { contains: "John" } } })

// เรียงลำดับ
await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })

// จำกัดจำนวน
await prisma.user.findMany({ take: 10, skip: 0 })

// นับจำนวน
await prisma.user.count()
```

### 4. การใช้ where

```javascript
// เท่ากับ
{ where: { email: "john@test.com" } }

// ไม่เท่ากับ
{ where: { NOT: { email: "admin@test.com" } } }

// มากกว่า
{ where: { id: { gt: 5 } } } // id > 5

// น้อยกว่า
{ where: { id: { lt: 10 } } } // id < 10

// ระหว่าง
{ where: { id: { gte: 1, lte: 10 } } } // 1 <= id <= 10

// หลายเงื่อนไข
{ where: { AND: [{ id: { gt: 5 } }, { name: "John" }] } }

// หรือ
{ where: { OR: [{ name: "John" }, { name: "Jane" }] } }
```

---

## การเพิ่ม Route ใหม่

### ขั้นตอนที่ 1: สร้าง Controller

สร้างไฟล์ `src/controllers/postController.js`:

```javascript
import prisma from '../lib/prisma.js';

// ดึงข้อมูลทั้งหมด
export const getPosts = async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany();
    res.json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// ดึง 1 รายการ
export const getPostById = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// สร้างใหม่
export const createPost = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const post = await prisma.post.create({
      data: { title, content },
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
import { getPosts, getPostById, createPost } from '../controllers/postController.js';

const router = express.Router();

router.route('/').get(getPosts).post(createPost);
router.route('/:id').get(getPostById);

export default router;
```

### ขั้นตอนที่ 3: Restart Server

```bash
npm run dev
```

ผลลัพธ์:
```
Route loaded: /api/post
Server running on port 3000
```

**เท่านี้ก็ได้ API ใหม่ที่ `/api/post` โดยไม่ต้องแก้ไข server.js!**

---

## การเพิ่ม Table ใหม่

### ขั้นตอนที่ 1: เพิ่ม Model ใน schema.prisma

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### ขั้นตอนที่ 2: Run Migration

```bash
npx prisma migrate dev --name add_post_table
```

### ขั้นตอนที่ 3: Generate Client

```bash
npx prisma generate
```

**เท่านี้ก็ใช้ `prisma.post` ได้เลย!**

---

## สรุป

```
src/server.js         → เริ่มต้นทุกอย่าง, ตั้งค่า middleware
src/lib/prisma.js    → เชื่อมต่อ PostgreSQL
src/middleware/       → ทำงานก่อน route (logger, errorHandler)
src/routes/           → กำหนด URL patterns
src/controllers/      → Logic การทำงาน
prisma/schema.prisma → โครงสร้างตารางในฐานข้อมูล
```

**หลักการสำคัญ:**
1. Middleware ทำงานก่อน route handler
2. Controller ดูแล business logic
3. Route จับคู่ URL → Controller
4. Prisma แปลง JavaScript → SQL
5. Auto Loader ช่วยให้เพิ่ม route โดยไม่ต้องแก้ไข server.js
