# 🚀 NestJS TaskFlow API

A robust, scalable, and secure task management API built with **NestJS**, **PostgreSQL**, **Redis**, and **BullMQ**. This project showcases clean architecture, modular domain separation, secure authentication, and job queue processing using modern best practices.

---

## 🔧 Tech Stack

| Tech         | Description                     |
|--------------|---------------------------------|
| **NestJS**   | Backend framework               |
| **TypeORM**  | ORM for PostgreSQL              |
| **PostgreSQL**| Relational database            |
| **Redis**    | Caching & job queues            |
| **BullMQ**   | Queue management                |
| **Bun**      | Fast JS/TS package manager      |
| **JWT**      | Authentication                  |

---

## 📁 Project Structure Highlights

- Modular domain separation (Tasks, Auth, Users, etc.)
- Global middleware for logging, rate limiting, and error handling
- JWT-based session auth with session persistence
- Job queues for async background processing
- Clean architecture using services, repositories, and DTOs

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/DarshanChauhan/nestjs-script-assist.git
cd nestjs-script-assist
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Setup Environment

```bash
cp .env.example .env
# ✅ .env file created. Update values only if needed.
```

### 4. Create PostgreSQL DB

```bash
createdb -U postgres taskflow
```

### 5. Build & Migrate DB

```bash
bun run build
bun run migration:run
```

### 6. Seed Sample Data

```bash
bun run seed
```

### 7. Start Dev Server

```bash
bun run start:dev
```

---

## 👥 Seeded Users

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@example.com | admin123  |
| User  | user@example.com  | user123   |

---

## 📚 API Endpoints

### 🔐 Auth
- `POST /auth/register` – Register new user
- `POST /auth/login` – Login user

### ✅ Tasks
- `GET /tasks` – List with pagination
- `GET /tasks/:id` – Task detail
- `POST /tasks` – Create task
- `PATCH /tasks/:id` – Update task
- `DELETE /tasks/:id` – Delete task
- `POST /tasks/batch` – Batch operations

---

## 🧪 Testing (Optional)

```bash
bun test
```

---

## 🧠 Author

Built with ❤️ by [Darshan Chauhan](https://github.com/DarshanChauhan)

---

## 📜 License

MIT © 2025 Darshan Chauhan
