# API Specification

Base URL

```
/api/v1
```

---

# Authentication

| Method | Endpoint |
|---------|----------|
| POST | /auth/login |
| POST | /auth/logout |
| GET | /auth/me |

---

# Players

| Method | Endpoint |
|---------|----------|
| GET | /players |
| GET | /players/{id} |
| POST | /players |
| PUT | /players/{id} |
| DELETE | /players/{id} |

---

# Clubs

| Method | Endpoint |
|---------|----------|
| GET | /clubs |
| GET | /clubs/{id} |
| POST | /clubs |
| PUT | /clubs/{id} |
| DELETE | /clubs/{id} |

---

# Seasons

| Method | Endpoint |
|---------|----------|
| GET | /seasons |
| POST | /seasons |
| PUT | /seasons/{id} |

---

# Registrations

| Method | Endpoint |
|---------|----------|
| GET | /registrations |
| POST | /registrations |
| PATCH | /registrations/{id} |

---

# Transfers

| Method | Endpoint |
|---------|----------|
| GET | /transfers |
| GET | /transfers/{id} |
| POST | /transfers |
| PATCH | /transfers/{id} |
| DELETE | /transfers/{id} |

---

# Transfer Approvals

| Method | Endpoint |
|---------|----------|
| GET | /approvals |
| POST | /approvals |

---

# Documents

| Method | Endpoint |
|---------|----------|
| POST | /documents |
| GET | /documents/{id} |
| DELETE | /documents/{id} |

---

# Notifications

| Method | Endpoint |
|---------|----------|
| GET | /notifications |
| PATCH | /notifications/{id} |

---

# Dashboard

| Method | Endpoint |
|---------|----------|
| GET | /dashboard/admin |
| GET | /dashboard/club |
| GET | /dashboard/player |