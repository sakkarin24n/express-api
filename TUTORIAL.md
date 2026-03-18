# Express.js + Prisma + PostgreSQL Setup Tutorial

## Requirements

- **Node.js**: v20+ (This project uses v25.7.0)
- **npm**: v10+ (This project uses v11.11.1)
- **PostgreSQL**: v14+ installed and running

---

## Project Versions

| Package | Version |
|---------|---------|
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

## Folder Structure

```
express-new/
├── src/
│   ├── server.js              # Entry point
│   ├── lib/
│   │   └── prisma.js          # Prisma client setup
│   ├── middleware/
│   │   ├── logger.js          # Request logger
│   │   └── errorHandler.js    # Error handling
│   ├── controllers/
│   │   └── userController.js  # User CRUD operations
│   └── routes/
│       ├── index.js           # Auto route loader
│       └── userRoutes.js      # User routes
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── config.ts              # Prisma config
├── .env                       # Environment variables
└── package.json
```

---

## Setup Commands

### 1. Initialize Project
```bash
npm init -y
```

### 2. Install All Dependencies
```bash
npm install express dotenv morgan cors
npm install prisma @prisma/client @prisma/adapter-pg pg
npm install -D nodemon
```

### 3. Setup Environment
Create `.env` file:
```
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
```

### 4. Initialize Prisma
```bash
npx prisma init
```

### 5. Configure Prisma

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

### 6. Run Migration & Generate Client
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 7. Start Server
```bash
npm run dev
```

---

## All Code Files

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user | Get all users |
| GET | /api/user/:id | Get single user |
| POST | /api/user | Create user |
| PUT | /api/user/:id | Update user |
| DELETE | /api/user/:id | Delete user |

---

## How to Add New Table

### Step 1: Add Model to schema.prisma
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

### Step 2: Run Migration
```bash
npx prisma migrate dev --name add_post
npx prisma generate
```

---

## How to Add New Route

### Step 1: Create Controller
Create `src/controllers/postController.js`:
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

### Step 2: Create Routes
Create `src/routes/postRoutes.js`:
```javascript
import express from 'express';
import { getPosts, createPost } from '../controllers/postController.js';

const router = express.Router();

router.route('/').get(getPosts).post(createPost);

export default router;
```

### Step 3: Restart Server
```bash
npm run dev
```

The route will auto-load at `/api/post`.

---

## Naming Convention for Routes

| File Name | API Path |
|-----------|----------|
| userRoutes.js | /api/user |
| postRoutes.js | /api/post |
| postsRoutes.js | /api/posts |
| productRoutes.js | /api/product |

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npx prisma studio` | Open Prisma GUI |
| `npx prisma migrate dev` | Create migration |
| `npx prisma migrate reset` | Reset database |
| `npx prisma db push` | Push schema to DB |
| `npx prisma generate` | Regenerate client |

---

## Error Codes Reference

| Code | Description |
|------|-------------|
| P2002 | Unique constraint failed |
| P2025 | Record not found |

---

## How Auto Route Loader Works

The `src/routes/index.js` file:
1. Reads all `.js` files in the `routes` folder
2. Ignores `index.js` itself
3. Takes filename (e.g., `userRoutes.js`)
4. Removes "Routes" suffix → `user`
5. Prepends `/api/` → `/api/user`
6. Auto-mounts the route

**No server.js editing needed!**
