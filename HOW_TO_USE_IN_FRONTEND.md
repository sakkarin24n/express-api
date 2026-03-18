# HOW_TO_USE_IN_FRONTEND.md - คู่มือการใช้ API กับ Frontend

## สารบัญ
1. [Overview](#overview)
2. [React](#react)
3. [Vue 3](#vue-3)
4. [Svelte](#svelte)
5. [Fetch vs Axios](#fetch-vs-axios)
6. [การจัดการ Error](#การจัดการ-error)
7. [Authentication](#authentication)
8. [CORS Setup](#cors-setup)

---

## Overview

### API ที่มี
```
Base URL: http://localhost:3000

GET    /api/user        - ดึง users ทั้งหมด
GET    /api/user/:id    - ดึง user คนเดียว
POST   /api/user        - สร้าง user ใหม่
PUT    /api/user/:id    - แก้ไข user
DELETE /api/user/:id    - ลบ user
```

### รูปแบบ Response
```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Error message"
}
```

### วิธีการเรียก API
```
GET    - ดึงข้อมูล (ใช้ query string)
POST   - ส่งข้อมูลใหม่ (ใช้ body)
PUT    - แก้ไขข้อมูล (ใช้ body + params)
DELETE - ลบข้อมูล (ใช้ params)
```

---

## React

### 1. สร้างโปรเจกต์
```bash
# สร้างโปรเจกต์ใหม่
npm create vite@latest my-app -- --template react
cd my-app
npm install

# ติดตั้ง Axios (แนะนำ)
npm install axios
```

### 2. สร้าง API Service
สร้างไฟล์ `src/services/api.js`:
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  // Users
  getUsers: () => api.get('/user'),
  getUser: (id) => api.get(`/user/${id}`),
  createUser: (data) => api.post('/user', data),
  updateUser: (id, data) => api.put(`/user/${id}`, data),
  deleteUser: (id) => api.delete(`/user/${id}`),
};
```

### 3. ดึงข้อมูล (GET)
สร้างไฟล์ `src/pages/Users.jsx`:
```jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>กำลังโหลด...</p>;
  if (error) return <p style={{color: 'red'}}>{error}</p>;

  return (
    <div>
      <h1>รายชื่อ Users</h1>
      <button onClick={fetchUsers}>รีเฟรช</button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Users;
```

### 4. สร้างข้อมูลใหม่ (POST)
สร้างไฟล์ `src/pages/CreateUser.jsx`:
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateUser() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.createUser(formData);
      if (response.data.success) {
        alert('สร้าง user สำเร็จ!');
        navigate('/users');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>สร้าง User ใหม่</h1>
      
      {error && <p style={{color: 'red'}}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>ชื่อ:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label>อีเมล:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label>รหัสผ่าน:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </form>
    </div>
  );
}

export default CreateUser;
```

### 5. แก้ไขข้อมูล (PUT)
สร้างไฟล์ `src/pages/EditUser.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.getUser(id);
      if (response.data.success) {
        const { name, email } = response.data.data;
        setFormData({ name, email, password: '' });
      }
    } catch (err) {
      setError('ไม่พบ user นี้');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // ส่งเฉพาะ field ที่มีการเปลี่ยนแปลง
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      
      const response = await api.updateUser(id, updateData);
      if (response.data.success) {
        alert('อัพเดทสำเร็จ!');
        navigate('/users');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>แก้ไข User</h1>
      
      {error && <p style={{color: 'red'}}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="เว้นว่างไว้ถ้าไม่เปลี่ยนรหัส"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </form>
    </div>
  );
}

export default EditUser;
```

### 6. ลบข้อมูล (DELETE)
```jsx
const deleteUser = async (id) => {
  if (!confirm('ยืนยันการลบ?')) return;
  
  try {
    const response = await api.deleteUser(id);
    if (response.data.success) {
      alert('ลบสำเร็จ!');
      // อัพเดท list
      setUsers(users.filter(u => u.id !== id));
    }
  } catch (err) {
    alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
  }
};

// ใน JSX
<button onClick={() => deleteUser(user.id)}>ลบ</button>
```

### 7. ตั้งค่า Router
สร้างไฟล์ `src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Users from './pages/Users';
import CreateUser from './pages/CreateUser';
import EditUser from './pages/EditUser';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 10, borderBottom: '1px solid #ccc' }}>
        <Link to="/users">รายชื่อ</Link> |{' '}
        <Link to="/users/create">สร้างใหม่</Link>
      </nav>
      
      <Routes>
        <Route path="/users" element={<Users />} />
        <Route path="/users/create" element={<CreateUser />} />
        <Route path="/users/edit/:id" element={<EditUser />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Vue 3

### 1. สร้างโปรเจกต์
```bash
npm create vite@latest my-app -- --template vue
cd my-app
npm install

# ติดตั้ง Axios
npm install axios
```

### 2. สร้าง API Service
สร้างไฟล์ `src/services/api.js`:
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  getUsers: () => api.get('/user'),
  getUser: (id) => api.get(`/user/${id}`),
  createUser: (data) => api.post('/user', data),
  updateUser: (id, data) => api.put(`/user/${id}`, data),
  deleteUser: (id) => api.delete(`/user/${id}`),
};
```

### 3. หน้ารายชื่อ Users
สร้างไฟล์ `src/views/Users.vue`:
```vue
<template>
  <div>
    <h1>รายชื่อ Users</h1>
    
    <button @click="fetchUsers">รีเฟรช</button>
    
    <p v-if="loading">กำลังโหลด...</p>
    <p v-if="error" style="color: red">{{ error }}</p>
    
    <ul v-if="!loading && !error">
      <li v-for="user in users" :key="user.id">
        {{ user.name }} - {{ user.email }}
        <button @click="deleteUser(user.id)">ลบ</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const users = ref([]);
const loading = ref(false);
const error = ref(null);

const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.getUsers();
    if (response.data.success) {
      users.value = response.data.data;
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'เกิดข้อผิดพลาด';
  } finally {
    loading.value = false;
  }
};

const deleteUser = async (id) => {
  if (!confirm('ยืนยันการลบ?')) return;
  
  try {
    const response = await api.deleteUser(id);
    if (response.data.success) {
      users.value = users.value.filter(u => u.id !== id);
    }
  } catch (err) {
    alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
  }
};

onMounted(() => {
  fetchUsers();
});
</script>
```

### 4. หน้าสร้าง User
สร้างไฟล์ `src/views/CreateUser.vue`:
```vue
<template>
  <div>
    <h1>สร้าง User ใหม่</h1>
    
    <p v-if="error" style="color: red">{{ error }}</p>
    
    <form @submit.prevent="handleSubmit">
      <div>
        <label>ชื่อ:</label>
        <input v-model="formData.name" type="text" required />
      </div>
      
      <div>
        <label>อีเมล:</label>
        <input v-model="formData.email" type="email" required />
      </div>
      
      <div>
        <label>รหัสผ่าน:</label>
        <input v-model="formData.password" type="password" required />
      </div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'กำลังบันทึก...' : 'บันทึก' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const formData = ref({
  name: '',
  email: '',
  password: '',
});

const loading = ref(false);
const error = ref(null);

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.createUser(formData.value);
    if (response.data.success) {
      alert('สร้าง user สำเร็จ!');
      router.push('/users');
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'เกิดข้อผิดพลาด';
  } finally {
    loading.value = false;
  }
};
</script>
```

### 5. ตั้งค่า Router
ติดตั้ง vue-router:
```bash
npm install vue-router
```

สร้างไฟล์ `src/router/index.js`:
```javascript
import { createRouter, createWebHistory } from 'vue-router';
import Users from '../views/Users.vue';
import CreateUser from '../views/CreateUser.vue';

const routes = [
  { path: '/users', component: Users },
  { path: '/users/create', component: CreateUser },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

แก้ไข `src/main.js`:
```javascript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

createApp(App).use(router).mount('#app');
```

แก้ไข `src/App.vue`:
```vue
<template>
  <nav style="padding: 10px; border-bottom: 1px solid #ccc">
    <router-link to="/users">รายชื่อ</router-link> |
    <router-link to="/users/create">สร้างใหม่</router-link>
  </nav>
  
  <router-view />
</template>
```

---

## Svelte

### 1. สร้างโปรเจกต์
```bash
npm create vite@latest my-app -- --template svelte
cd my-app
npm install

# ติดตั้ง Axios
npm install axios
```

### 2. สร้าง API Service
สร้างไฟล์ `src/lib/api.js`:
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  getUsers: () => api.get('/user'),
  getUser: (id) => api.get(`/user/${id}`),
  createUser: (data) => api.post('/user', data),
  updateUser: (id, data) => api.put(`/user/${id}`, data),
  deleteUser: (id) => api.delete(`/user/${id}`),
};
```

### 3. หน้ารายชื่อ Users
สร้างไฟล์ `src/routes/Users.svelte`:
```svelte
<script>
  import { onMount } from 'svelte';
  import api from '../lib/api.js';

  let users = [];
  let loading = false;
  let error = null;

  onMount(() => {
    fetchUsers();
  });

  async function fetchUsers() {
    loading = true;
    error = null;
    
    try {
      const response = await api.getUsers();
      if (response.data.success) {
        users = response.data.data;
      }
    } catch (err) {
      error = err.response?.data?.error || 'เกิดข้อผิดพลาด';
    } finally {
      loading = false;
    }
  }

  async function deleteUser(id) {
    if (!confirm('ยืนยันการลบ?')) return;
    
    try {
      const response = await api.deleteUser(id);
      if (response.data.success) {
        users = users.filter(u => u.id !== id);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  }
</script>

<h1>รายชื่อ Users</h1>

<button on:click={fetchUsers}>รีเฟรช</button>

{#if loading}
  <p>กำลังโหลด...</p>
{/if}

{#if error}
  <p style="color: red">{error}</p>
{/if}

<ul>
  {#each users as user}
    <li>
      {user.name} - {user.email}
      <button on:click={() => deleteUser(user.id)}>ลบ</button>
    </li>
  {/each}
</ul>
```

### 4. หน้าสร้าง User
สร้างไฟล์ `src/routes/CreateUser.svelte`:
```svelte
<script>
  import { goto } from '$app/navigation';
  import api from '../lib/api.js';

  let formData = {
    name: '',
    email: '',
    password: '',
  };
  let loading = false;
  let error = null;

  async function handleSubmit() {
    loading = true;
    error = null;
    
    try {
      const response = await api.createUser(formData);
      if (response.data.success) {
        alert('สร้าง user สำเร็จ!');
        goto('/users');
      }
    } catch (err) {
      error = err.response?.data?.error || 'เกิดข้อผิดพลาด';
    } finally {
      loading = false;
    }
  }
</script>

<h1>สร้าง User ใหม่</h1>

{#if error}
  <p style="color: red">{error}</p>
{/if}

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label>ชื่อ:</label>
    <input bind:value={formData.name} type="text" required />
  </div>
  
  <div>
    <label>อีเมล:</label>
    <input bind:value={formData.email} type="email" required />
  </div>
  
  <div>
    <label>รหัสผ่าน:</label>
    <input bind:value={formData.password} type="password" required />
  </div>
  
  <button type="submit" disabled={loading}>
    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
  </button>
</form>
```

### 5. ตั้งค่า Routing (SvelteKit)
```bash
npm install -D @sveltejs/adapter-auto
```

สร้างไฟล์ `src/routes/+layout.svelte`:
```svelte
<nav style="padding: 10px; border-bottom: 1px solid #ccc">
  <a href="/users">รายชื่อ</a> |
  <a href="/users/create">สร้างใหม่</a>
</nav>

<slot />
```

---

## Fetch vs Axios

### การใช้ Fetch (ไม่ต้องติดตั้ง)
```javascript
// GET
const response = await fetch('http://localhost:3000/api/user');
const data = await response.json();
if (data.success) {
  console.log(data.data);
}

// POST
const response = await fetch('http://localhost:3000/api/user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John',
    email: 'john@test.com',
    password: '123456',
  }),
});
const data = await response.json();
```

### การใช้ Axios (แนะนำ)
```javascript
import axios from 'axios';

// GET
const response = await axios.get('http://localhost:3000/api/user');
// response.data คือ JSON ที่ API ส่งมา

// POST
const response = await axios.post('http://localhost:3000/api/user', {
  name: 'John',
  email: 'john@test.com',
  password: '123456',
});
```

### ข้อดีของ Axios
```
1. ✅ รองรับ interceptors (ดักจับ request/response)
2. ✅ รองรับ cancel request
3. ✅ รองรับ timeout
4. ✅ รองรับ file upload
5. ✅ Auto JSON transform
6. ✅ ดีกว่า error handling
```

---

## การจัดการ Error

### แบบ Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor สำหรับ error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server ตอบกลับมามี error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // ไม่ได้รับ response (เช่น server ล่ม)
      console.error('Network Error');
    } else {
      // ตั้งค่าผิด
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);
```

### แบบ React Hooks
สร้างไฟล์ `src/hooks/useApi.js`:
```javascript
import { useState, useCallback } from 'react';
import api from '../services/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (apiCall, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(...args);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'เกิดข้อผิดพลาด';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, request };
}

// ใช้งาน
function MyComponent() {
  const { loading, error, request } = useApi();

  const fetchData = async () => {
    const data = await request(api.getUsers);
    console.log(data);
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}
```

---

## Authentication

### การส่ง Token
```javascript
// สร้าง axios instance ที่มี token
const apiAuth = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor เพิ่ม token ทุก request
apiAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Service
export default {
  login: (data) => apiAuth.post('/auth/login', data),
  register: (data) => apiAuth.post('/auth/register', data),
  getProfile: () => apiAuth.get('/auth/profile'),
  updateProfile: (data) => apiAuth.put('/auth/profile', data),
};
```

### React - สร้าง Context สำหรับ Auth
```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.getProfile();
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await api.login({ email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## CORS Setup

### Backend (Express)
ติดตั้ง cors:
```bash
npm install cors
```

เพิ่มใน `src/server.js`:
```javascript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173', // URL ของ frontend
  credentials: true, // อนุญาตให้ส่ง cookie
}));

// หรืออนุญาตทุก origin (ไม่แนะนำ)
app.use(cors());
```

### Frontend - Axios
```javascript
// ถ้าใช้ credentials
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // ส่ง cookie
});
```

---

## สรุป

```
┌─────────────┐         HTTP          ┌─────────────┐
│   Frontend  │ ───────────────────▶ │    API      │
│  (React/Vue)│                       │  (Express)  │
│             │ ◀──────────────────── │             │
└─────────────┘        JSON          └─────────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │  PostgreSQL │
                             │  (Prisma)   │
                             └─────────────┘
```

### สิ่งที่ต้องจำ
```
1. ✅ ใช้ axios หรือ fetch เรียก API
2. ✅ ดึงข้อมูลจาก response.data (axios)
3. ✅ จัดการ error ด้วย try-catch
4. ✅ ตั้งค่า CORS ที่ backend
5. ✅ ใช้ interceptor สำหรับ auth token
6. ✅ ใช้ loading state แสดงสถานะ
```
