# PRISMA_TUTO.md - คู่มือการใช้ Prisma แบบละเอียด

## สารบัญ
1. [Prisma คืออะไร](#prisma-คืออะไร)
2. [Schema & Models](#schema--models)
3. [Field Types](#field-types)
4. [Attributes](#attributes)
5. [Relations](#relations)
6. [Prisma Client Methods](#prisma-client-methods)
7. [Query Examples](#query-examples)
8. [Commands](#commands)

---

## Prisma คืออะไร

Prisma เป็น ORM (Object-Relational Mapping) ที่ช่วยให้เราทำงานกับฐานข้อมูลโดยใช้ JavaScript object แทนการเขียน SQL

```
┌──────────────┐
│  JavaScript  │
│    Code      │
└──────┬───────┘
       │
       │ prisma.user.findMany()
       ▼
┌──────────────┐
│    Prisma    │──▶ SELECT * FROM "User";
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────────────┘
```

### ข้อดีของ Prisma
```
1. ✅ Type-safe - ตรวจสอบ type อัตโนมัติ
2. ✅ Auto-completion - แนะนำ code อัตโนมัติ
3. ✅ อ่านง่าย - ใช้ JavaScript object แทน SQL
4. ✅ Migration - จัดการ schema ง่าย
5. ✅ Real-time - รองรับ real-time subscriptions
```

---

## Schema & Models

### โครงสร้างไฟล์ prisma/schema.prisma
```prisma
// 1. Generator - บอกว่าจะใช้ Prisma Client แบบไหน
generator client {
  provider = "prisma-client-js"
}

// 2. Datasource - บอกว่าใช้ database อะไร
datasource db {
  provider = "postgresql"
}

// 3. Models - โครงสร้างตาราง
model User {
  // fields ที่นี่
}
```

---

## Field Types

### Primitives
```prisma
model User {
  id        Int       // ตัวเลข integer
  name      String    // ข้อความ
  age       Float     // ทศนิยม
  active    Boolean   // true/false
  birthDate DateTime  // วันที่/เวลา
  bio       Json      // JSON object
  avatar    Bytes     // binary data
}
```

### Optional & Default
```prisma
model User {
  id        Int     @id
  name      String              // required (ต้องมีค่า)
  nickname  String?             // optional (เป็น null ได้)
  age       Int?               // optional
  active    Boolean @default(true)  // ค่าเริ่มต้น
  createdAt DateTime @default(now()) // ค่าเริ่มต้นเป็นเวลาปัจจุบัน
}
```

### ตัวอย่างการกำหนด Default Value
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String   @default("No Name")
  price       Float    @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Attributes

### @id - Primary Key
```prisma
model User {
  id Int @id          // primary key
}
```

### @default - ค่าเริ่มต้น
```prisma
model User {
  id      Int     @id @default(autoincrement())
  active  Boolean @default(true)
  code    String  @default(uuid())
}
```

### @unique - ห้ามซ้ำ
```prisma
model User {
  id    Int    @id
  email String @unique  // ค่านี้ห้ามซ้ำ
}
```

### @default(now()) - วันที่ปัจจุบัน
```prisma
model User {
  createdAt DateTime @default(now())
}
```

### @updatedAt - อัพเดทอัตโนมัติ
```prisma
model User {
  updatedAt DateTime @updatedAt
}
```

### @map - เปลี่ยนชื่อใน DB
```prisma
model User {
  name String @map("user_name")  // ใน DB จะเป็น user_name
}
```

### @ignore - ไม่สร้าง field นี้ใน DB
```prisma
model User {
  id    Int    @id
  temp  String @ignore  // Prisma จะไม่สนใจ field นี้
}
```

---

## Relations

### One-to-One (1:1)
```prisma
model User {
  id        Int      @id
  email     String   @unique
  profile   Profile? // relation
}

model Profile {
  id      Int    @id
  bio     String
  userId  Int    @unique  // foreign key
  user    User   @relation(fields: [userId], references: [id])
}
```

### One-to-Many (1:N)
```prisma
model User {
  id     Int     @id
  email  String  @unique
  posts  Post[]  // user หนึ่งมีหลาย posts
}

model Post {
  id      Int    @id
  title   String
  userId  Int    // foreign key
  user    User   @relation(fields: [userId], references: [id])
}
```

### Many-to-Many (N:N)
```prisma
// แบบ Implicit (Prisma สร้าง join table ให้อัตโนมัติ)
model Post {
  id      Int        @id
  title   String
  tags    Tag[]
}

model Tag {
  id    Int    @id
  name  String
  posts Post[]
}

// แบบ Explicit (กำหนด join table เอง)
model Post {
  id        Int          @id
  title     String
  categories Category[]  @relation("PostCategories")
}

model Category {
  id    Int    @id
  name  String
  posts Post[] @relation("PostCategories")
}
```

### Self Relations
```prisma
model User {
  id        Int     @id
  name      String
  managerId Int?
  manager   User?   @relation("ManagerEmployees", fields: [managerId], references: [id])
  employees User[]  @relation("ManagerEmployees")
}
```

### การใช้งาน Relations
```javascript
// ดึง user พร้อม profile
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { profile: true }
});
// Result: { id: 1, email: "...", profile: { bio: "..." } }

// ดึง user พร้อม posts ทั้งหมด
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true }
});

// ดึง post พร้อม tags
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: { tags: true }
});
```

---

## Prisma Client Methods

### findMany() - ดึงหลายรายการ
```javascript
const users = await prisma.user.findMany()
```

### findUnique() - ดึงรายการเดียว
```javascript
const user = await prisma.user.findUnique({
  where: { id: 1 }
})
```

### findFirst() - ดึงรายการแรกที่เจอ
```javascript
const user = await prisma.user.findFirst({
  where: { name: 'John' }
})
```

### create() - สร้างใหม่
```javascript
const user = await prisma.user.create({
  data: {
    name: 'John',
    email: 'john@test.com',
    password: '123'
  }
})
```

### update() - อัพเดท
```javascript
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Jane'
  }
})
```

### delete() - ลบ
```javascript
await prisma.user.delete({
  where: { id: 1 }
})
```

### upsert() - ถ้าไม่มี则สร้าง ถ้ามี则อัพเดท
```javascript
const user = await prisma.user.upsert({
  where: { email: 'john@test.com' },
  create: {
    name: 'John',
    email: 'john@test.com',
    password: '123'
  },
  update: {
    name: 'John Updated'
  }
})
```

### createMany() - สร้างหลายรายการ
```javascript
const users = await prisma.user.createMany({
  data: [
    { name: 'John', email: 'john@test.com', password: '123' },
    { name: 'Jane', email: 'jane@test.com', password: '456' },
    { name: 'Bob', email: 'bob@test.com', password: '789' },
  ]
})
```

### updateMany() - อัพเดทหลายรายการ
```javascript
await prisma.user.updateMany({
  where: { active: false },
  data: { active: true }
})
```

### deleteMany() - ลบหลายรายการ
```javascript
await prisma.user.deleteMany({
  where: { createdAt: { lt: lastYear } }
})
```

### count() - นับจำนวน
```javascript
const count = await prisma.user.count()

const activeCount = await prisma.user.count({
  where: { active: true }
})
```

---

## Query Examples

### WHERE - การค้นหา

```javascript
// เท่ากับ
await prisma.user.findMany({
  where: { email: 'john@test.com' }
})

// ไม่เท่ากับ
await prisma.user.findMany({
  where: { NOT: { email: 'admin@test.com' } }
})

// มากกว่า
await prisma.user.findMany({
  where: { age: { gt: 18 } }  // greater than
})

// น้อยกว่า
await prisma.user.findMany({
  where: { age: { lt: 65 } }  // less than
})

// มากกว่าหรือเท่ากับ
await prisma.user.findMany({
  where: { age: { gte: 18 } }  // greater than or equal
})

// น้อยกว่าหรือเท่ากับ
await prisma.user.findMany({
  where: { age: { lte: 65 } }  // less than or equal
})

// ระหว่าง
await prisma.user.findMany({
  where: {
    age: { gte: 18, lte: 65 }  // 18 <= age <= 65
  }
})

// IN - อยู่ใน list
await prisma.user.findMany({
  where: {
    role: { in: ['ADMIN', 'MODERATOR'] }
  }
})

// NOT IN - ไม่อยู่ใน list
await prisma.user.findMany({
  where: {
    role: { notIn: ['GUEST', 'BANNED'] }
  }
})

// LIKE / contains - ค้นหาข้อความ
await prisma.user.findMany({
  where: {
    name: { contains: 'John' }  // มีคำว่า John
  }
})

// startsWith - ขึ้นต้นด้วย
await prisma.user.findMany({
  where: {
    name: { startsWith: 'John' }
  }
})

// endsWith - ลงท้ายด้วย
await prisma.user.findMany({
  where: {
    name: { endsWith: 'Doe' }
  }
})

// mode: 'insensitive' - ไม่สนใจตัวพิมพ์ใหญ่-เล็ก
await prisma.user.findMany({
  where: {
    name: { contains: 'john', mode: 'insensitive' }
  }
})
```

### AND / OR / NOT

```javascript
// AND - ต้องตรงทุกเงื่อนไข
await prisma.user.findMany({
  where: {
    AND: [
      { age: { gte: 18 } },
      { active: true }
    ]
  }
})

// OR - ตรงอย่างน้อย 1 เงื่อนไข
await prisma.user.findMany({
  where: {
    OR: [
      { name: 'John' },
      { name: 'Jane' }
    ]
  }
})

// NOT - ไม่ตรงเงื่อนไข
await prisma.user.findMany({
  where: {
    NOT: { role: 'BANNED' }
  }
})

// ซ้อนกัน
await prisma.user.findMany({
  where: {
    OR: [
      { AND: [{ age: { gte: 18 } }, { active: true }] },
      { role: 'ADMIN' }
    ]
  }
})
```

### SELECT - เลือกเฉพาะ Field

```javascript
// เลือกเฉพาะ field ที่ต้องการ
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
})
// Result: [{ id: 1, name: 'John', email: 'john@test.com' }]

// ไม่เอา field นี้
const users = await prisma.user.findMany({
  select: {
    email: true,
    password: false  // ❌ ไม่ได้
  }
})
```

### ORDER BY - การเรียงลำดับ

```javascript
// เรียงจากน้อยไปมาก
await prisma.user.findMany({
  orderBy: { createdAt: 'asc' }
})

// เรียงจากมากไปน้อย
await prisma.user.findMany({
  orderBy: { createdAt: 'desc' }
})

// เรียงหลาย field
await prisma.user.findMany({
  orderBy: [
    { role: 'asc' },
    { createdAt: 'desc' }
  ]
})
```

### PAGINATION - การแบ่งหน้า

```javascript
// ดึง 10 รายการแรก
await prisma.user.findMany({
  take: 10
})

// ข้าม 10 รายการแรก ดึง 10 รายการถัดไป
await prisma.user.findMany({
  skip: 10,
  take: 10
})

// หน้า 2 (แต่ละหน้า 10 รายการ)
await prisma.user.findMany({
  skip: (2 - 1) * 10,
  take: 10
})

// ดึงทั้งหมดแล้วนับ
const total = await prisma.user.count()
const users = await prisma.user.findMany({
  take: 10,
  skip: (page - 1) * 10
})
```

### DISTINCT - ไม่เอาซ้ำ

```javascript
// ไม่เอาชื่อที่ซ้ำ
await prisma.user.findMany({
  distinct: ['name'],
  select: { name: true }
})
```

---

## Relations Query

### Include Relations
```javascript
// ดึง user พร้อม posts
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true
  }
})

// ดึง user พร้อม posts และ profile
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true,
    profile: true
  }
})

// ดึง post พร้อม author และ tags
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: {
    author: true,
    tags: true
  }
})
```

### Filter ใน Relation
```javascript
// ดึง user พร้อมเฉพาะ posts ที่ published
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: { published: true }
    }
  }
})

// ดึง user พร้อม posts ที่เรียงตาม createdAt
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      orderBy: { createdAt: 'desc' },
      take: 5
    }
  }
})
```

### Nested Create
```javascript
// สร้าง user พร้อมสร้าง profile ในคำสั่งเดียว
const user = await prisma.user.create({
  data: {
    name: 'John',
    email: 'john@test.com',
    password: '123',
    profile: {
      create: {
        bio: 'Hello World'
      }
    }
  },
  include: { profile: true }
})
```

### Nested Update
```javascript
// อัพเดท user พร้อมอัพเดท profile
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Jane',
    profile: {
      update: {
        bio: 'Updated bio'
      }
    }
  },
  include: { profile: true }
})
```

### Connect Relations
```javascript
// เชื่อม post กับ user ที่มี id = 1
await prisma.post.update({
  where: { id: 1 },
  data: {
    author: {
      connect: { id: 1 }
    }
  }
})

// สร้าง post แล้วเชื่อมกับ user
await prisma.post.create({
  data: {
    title: 'New Post',
    author: {
      connect: { id: 1 }
    }
  }
})
```

### Disconnect Relations
```javascript
// ยกเลิกเชื่อม post กับ author
await prisma.post.update({
  where: { id: 1 },
  data: {
    author: {
      disconnect: true
    }
  }
})
```

---

## Transactions

### Sequential
```javascript
// ทำทีละขั้นตอน ถ้าผิดพลาดขั้นไหน ขั้นก่อนหน้าจะไม่ถูกยกเลิก
const user = await prisma.user.create({ data: { name: 'John' } });
const post = await prisma.post.create({ data: { title: 'Hi', authorId: user.id } });
```

### Interactive Transactions
```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function transferMoney(fromId, toId, amount) {
  const result = await prisma.$transaction(async (tx) => {
    // ถอนเงิน
    const from = await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } }
    });
    
    if (from.balance < 0) {
      throw new Error('ไม่มีเงินเพียงพอ');
    }
    
    // โอนเงิน
    const to = await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } }
    });
    
    return { from, to };
  });
  
  return result;
}
```

---

## Raw Queries

### กรณีต้องใช้ SQL โดยตรง
```javascript
// $queryRaw - ดึงข้อมูล
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE age > ${18}
`;

// $executeRaw - เพิ่ม/แก้ไข/ลบ
await prisma.$executeRaw`
  UPDATE "User" SET active = true WHERE createdAt < ${lastMonth}
`;
```

---

## Error Handling

```javascript
try {
  const user = await prisma.user.create({
    data: { name: 'John', email: 'john@test.com', password: '123' }
  });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint failed
    console.log('อีเมลนี้มีอยู่แล้ว');
  } else if (error.code === 'P2025') {
    // Record not found
    console.log('ไม่พบข้อมูลนี้');
  } else {
    console.error(error);
  }
}
```

### Error Codes ที่พบบ่อย
| Code | ความหมาย |
|------|----------|
| P2002 | Unique constraint failed (ซ้ำ) |
| P2025 | Record not found (ไม่พบ) |
| P2003 | Foreign key constraint failed |
| P2011 | Required field is null |
| P2000 | Value too long |

---

## Commands

### Initialize
```bash
# เริ่มต้น Prisma ในโปรเจกต์
npx prisma init
```

### Migration
```bash
# สร้าง migration ใหม่
npx prisma migrate dev --name add_posts

# รัน migration ที่มีอยู่
npx prisma migrate deploy

# ดู migration status
npx prisma migrate status

# reset database (ลบทั้งหมดแล้วสร้างใหม่)
npx prisma migrate reset

# ส่ง schema ไปที่ DB โดยตรง (ไม่ต้องสร้าง migration)
npx prisma db push
```

### Generate
```bash
# สร้าง Prisma Client
npx prisma generate

# ลบและสร้างใหม่
npx prisma generate --force
```

### Studio
```bash
# เปิด Prisma Studio (GUI สำหรับดู/แก้ไขข้อมูล)
npx prisma studio
```

### DB Commands
```bash
# ดูข้อมูลใน DB
npx prisma db pull

# seed ข้อมูลเริ่มต้น
npx prisma db seed

# validate schema
npx prisma validate

# format schema
npx prisma format
```

### Help
```bash
# ดู help
npx prisma --help

# ดู help ของคำสั่งเฉพาะ
npx prisma migrate --help
```

---

## Cheat Sheet

### Schema Definition
```prisma
model ModelName {
  id        Int      @id @default(autoincrement())
  field     String   @unique
  field2    Int?
  field3    Boolean  @default(true)
  field4    DateTime @updatedAt
  relation  Relation[]
}
```

### CRUD Operations
```javascript
// Create
prisma.model.create({ data: {} })

// Read One
prisma.model.findUnique({ where: { id: 1 } })

// Read Many
prisma.model.findMany({ where: {}, orderBy: {}, take: 10, skip: 0 })

// Update
prisma.model.update({ where: { id: 1 }, data: {} })

// Delete
prisma.model.delete({ where: { id: 1 } })

// Count
prisma.model.count({ where: {} })

// With Relations
prisma.model.findMany({ include: { relation: true } })
```
