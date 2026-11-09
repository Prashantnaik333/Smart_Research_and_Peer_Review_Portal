# Smart Research & Peer Review Portal

### A Hybrid SQL and NoSQL-Based Academic Research Management System

**Institution:** PES University  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–2027  
**Project Type:** DBMS Mini Project

---

## 1. Team Members

| Student Name | SRN |
|---|---|
| **Prashant Devendra Naik** | PES1UG24AM199 |
| **Pradyun P Urs** | PES1UG24AM195 |

---

## 2. Project Overview

The **Smart Research & Peer Review Portal** is a web-based academic research management system designed to simplify and organize the research paper submission and peer-review process.

Traditional academic research review processes often involve manual communication, scattered documents, and difficulty tracking reviewer assignments and feedback.

This project provides a centralized platform where students can submit research manuscripts, administrators can manage reviewer assignments, and reviewers can evaluate submitted research papers.

The system uses PostgreSQL to manage structured relational information and MongoDB for document-oriented review discussion data.

The application provides a student dashboard through which students can access their manuscript information and available reviewer feedback.

### Main Goals

- Simplify academic research paper submission.
- Organize reviewer allocation and evaluation.
- Maintain structured research and user information.
- Store reviewer scores and feedback.
- Provide students with access to their review results.
- Maintain an audit history of manuscript status changes.
- Demonstrate practical DBMS concepts using SQL and NoSQL databases.

---

## 3. Problem Statement

Academic research management involves multiple activities, including manuscript submission, reviewer assignment, evaluation, feedback collection, and final decision-making.

Managing these activities manually can lead to:

- Difficulty tracking submitted manuscripts.
- Inefficient reviewer allocation.
- Scattered reviewer comments and feedback.
- Difficulty maintaining evaluation records.
- Lack of centralized audit information.
- Delays in communicating evaluation results.

The proposed Smart Research & Peer Review Portal addresses these problems through a centralized web-based system backed by relational and document-oriented databases.

---

## 4. Project Objectives

1. Develop a centralized academic research management portal.
2. Implement user registration and authentication.
3. Support student manuscript submission and management.
4. Maintain reviewer profiles and expertise information.
5. Manage reviewer assignments.
6. Store technical and originality evaluation scores.
7. Allow reviewers to submit comments and recommendations.
8. Display evaluation results through a student dashboard.
9. Maintain manuscript status-change audit records.
10. Demonstrate relational database operations and NoSQL document storage.

---

## 5. Main Features

| Feature | Description |
|---|---|
| User Registration | Allows users to create accounts. |
| User Login | Provides authenticated access to the portal. |
| Role-Based Access | Supports different user roles. |
| Manuscript Submission | Allows students to submit research papers. |
| Manuscript Management | Maintains submitted research information and status. |
| Reviewer Management | Stores reviewer profiles and expertise. |
| Reviewer Assignment | Connects manuscripts with assigned reviewers. |
| Research Evaluation | Supports manuscript evaluation. |
| Technical Scoring | Stores technical evaluation scores. |
| Originality Scoring | Stores originality evaluation scores. |
| Reviewer Feedback | Stores comments and recommendations. |
| Student Dashboard | Displays available review information to students. |
| Audit Logging | Records manuscript status changes. |
| Discussion Storage | Stores document-oriented review discussion records in MongoDB. |

---

## 6. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework and backend API routes |
| React.js | User interface development |
| TypeScript | Type-safe application development |
| Tailwind CSS | User interface styling |
| Node.js | JavaScript runtime |
| PostgreSQL 18 | Relational database management |
| SQL | Database queries and operations |
| Node-postgres (`pg`) | PostgreSQL connectivity |
| MongoDB | Document-oriented data storage |
| MongoDB Compass | MongoDB database visualization and management |
| JOSE | JWT-based session management |
| Git | Version control |
| GitHub | Source-code hosting and collaboration |

---

## 7. System Architecture

The application follows a web-based client-server architecture.

### Architecture Overview

```text
             STUDENTS / REVIEWERS / ADMIN
                         |
                         v
                    WEB BROWSER
                         |
                         v
                 NEXT.JS APPLICATION
                         |
              -----------------------
              |                     |
              v                     v
          FRONTEND              BACKEND
          REACT UI              API ROUTES
                                    |
                                    v
                           AUTHENTICATION
                           BUSINESS LOGIC
                           DATABASE QUERIES
                                    |
                         -------------------
                         |                 |
                         v                 v
                     POSTGRESQL         MONGODB
                     DATABASE       DOCUMENT STORE
                         |                 |
                         v                 v
                    RELATIONAL       DISCUSSION
                       DATA           DOCUMENTS
                         |                 |
                         -------------------
                                    |
                                    v
                             APPLICATION
                                OUTPUT
                                    |
                         MANUSCRIPTS / REVIEWS
                               / FEEDBACK
```

### System Workflow

1. A student registers and logs in.
2. The student submits a research manuscript.
3. An administrator or coordinator manages reviewer allocation.
4. A reviewer evaluates the assigned manuscript.
5. The reviewer provides technical and originality scores.
6. The reviewer submits comments and recommendations.
7. The evaluation information is stored in the database.
8. The student accesses available review information through the dashboard.
9. Manuscript status changes are recorded in the audit log.

---

## 8. Database Design

The project uses PostgreSQL 18 as its primary relational database.

**Database Name:**

```sql
smartportal_db
```

The database contains nine physical tables and a view named `manuscript_review_summary`.

### 8.1 PostgreSQL Tables

| No. | Table | Purpose |
|---|---|---|
| 1 | departments | Stores department information. |
| 2 | users | Stores student, reviewer, and administrator accounts. |
| 3 | research_topics | Stores research topic information. |
| 4 | manuscripts | Stores submitted research papers. |
| 5 | reviewers | Stores reviewer profiles and expertise. |
| 6 | manuscript_topics | Connects manuscripts with research topics. |
| 7 | assignments | Stores reviewer assignments. |
| 8 | reviews | Stores reviewer scores and feedback. |
| 9 | audit_logs | Stores manuscript status-change audit records. |

**Additional database object:**

`manuscript_review_summary` – a PostgreSQL view used for review-summary queries. It is not a physical table.

### 8.2 Database Relationships

| Child Table | Foreign Key | Parent Table |
|---|---|---|
| users | department_id | departments |
| manuscripts | student_id | users |
| reviewers | user_id | users |
| assignments | manuscript_id | manuscripts |
| assignments | reviewer_id | reviewers |
| reviews | assignment_id | assignments |
| manuscript_topics | manuscript_id | manuscripts |
| manuscript_topics | topic_id | research_topics |
| audit_logs | user_id | users |

The `manuscript_topics` table uses a composite primary key:

```sql
PRIMARY KEY (manuscript_id, topic_id)
```

This prevents duplicate manuscript-topic relationships.

---

## 9. SQL and NoSQL Implementation

### 9.1 PostgreSQL – Relational Database

PostgreSQL stores structured information about:

- Users
- Departments
- Research topics
- Manuscripts
- Reviewers
- Assignments
- Reviews
- Audit logs

It maintains relationships using primary keys, foreign keys, unique constraints, and other database constraints.

### 9.2 MongoDB – NoSQL Database

MongoDB is used for document-oriented review discussion data.

The MongoDB database and collection demonstrated in MongoDB Compass are:

- Database: `smart_research_portal`
- Collection: `review_discussions`

The displayed collection contains review discussion documents with fields such as:

- `manuscript_id`
- `student_name`
- `discussion`
- `reviewer_name`
- `discussion_type`
- `created_at`
- `status`

This document-oriented structure supports storing discussion records with flexible fields.

### 9.3 Why Use Both PostgreSQL and MongoDB?

| PostgreSQL | MongoDB |
|---|---|
| Relational data storage | Document-oriented data storage |
| Structured tables | JSON-like documents |
| Primary and foreign keys | Document identifiers and flexible structures |
| SQL queries | Document queries |
| Used for users, manuscripts, and reviews | Used for review discussion documents |

The combination demonstrates how relational and document-oriented storage can support different types of application data.

---

## 10. Important SQL Concepts Demonstrated

The project demonstrates the following DBMS concepts.

### 10.1 DDL – Data Definition Language

Used to create and modify database structures.

```sql
CREATE TABLE departments (
    department_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10.2 DML – Data Manipulation Language

Used to insert, update, and delete records.

**INSERT:**

```sql
INSERT INTO research_topics
(topic_name, description)
VALUES
('Artificial Intelligence', 'AI research topics');
```

**UPDATE:**

```sql
UPDATE manuscripts
SET status = 'UNDER_REVIEW'
WHERE manuscript_id = 1;
```

**DELETE:**

```sql
DELETE FROM research_topics
WHERE topic_id = 5;
```

### 10.3 DQL – Data Query Language

Used to retrieve database information.

```sql
SELECT *
FROM manuscripts;
```

### 10.4 Primary Keys and Foreign Keys

Primary keys uniquely identify records. Foreign keys establish relationships between tables.

Example:

```sql
FOREIGN KEY (student_id)
REFERENCES users(user_id)
```

### 10.5 SQL JOIN

JOIN combines related information from multiple tables.

```sql
SELECT
    m.manuscript_id,
    m.title AS manuscript_title,
    u.full_name AS student_name,
    u.email AS student_email,
    m.status
FROM manuscripts m
INNER JOIN users u
ON m.student_id = u.user_id
ORDER BY m.manuscript_id;
```

This query retrieves manuscript details together with student information.

### 10.6 Aggregate Functions

Aggregate functions perform calculations on multiple records.

```sql
SELECT
    AVG(technical_score) AS average_technical_score,
    AVG(originality_score) AS average_originality_score,
    COUNT(*) AS total_reviews
FROM reviews;
```

Other aggregate functions include:

- `COUNT()`
- `SUM()`
- `AVG()`
- `MIN()`
- `MAX()`

### 10.7 GROUP BY

Used to group manuscript records by their status.

```sql
SELECT
    status,
    COUNT(*) AS total_manuscripts
FROM manuscripts
GROUP BY status;
```

### 10.8 Views

A view is a saved SQL query that behaves like a virtual table.

Project view:

```sql
SELECT *
FROM manuscript_review_summary;
```

### 10.9 Functions and Triggers

The project contains:

- Function: `log_manuscript_status_change()`
- Trigger: `manuscript_status_audit_trigger`

The trigger executes after an UPDATE operation on the `manuscripts` table and calls the function to insert a status-change record into `audit_logs`.

### 10.10 Transactions and ACID

The project demonstrates transaction commands:

```sql
BEGIN;

UPDATE manuscripts
SET status = 'UNDER_REVIEW'
WHERE manuscript_id = 1;

COMMIT;
```

The transaction commands are:

- `BEGIN`
- `COMMIT`
- `ROLLBACK`

The ACID properties are:

| Property | Meaning |
|---|---|
| Atomicity | A transaction is treated as one logical unit. |
| Consistency | Database constraints and rules remain valid. |
| Isolation | Concurrent transactions are controlled. |
| Durability | Committed data is persisted. |

### 10.11 Normalization

The database separates departments, users, manuscripts, reviewers, and review records into related tables to reduce unnecessary data duplication and maintain consistency.

### 10.12 Parameterized Queries

The backend uses parameterized SQL queries.

```typescript
const result = await pool.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);
```

Parameterized queries help protect the application against SQL injection.

---

## 11. Audit Logging

The project implements an automatic audit mechanism for manuscript status changes.

**Trigger:**

```text
manuscript_status_audit_trigger
```

**Function:**

```text
log_manuscript_status_change()
```

**Audit Table:**

```text
audit_logs
```

### Audit Workflow

```text
Manuscript Status Updated
          |
          v
PostgreSQL UPDATE Trigger
          |
          v
log_manuscript_status_change()
          |
          v
INSERT INTO audit_logs
          |
          v
Audit Record Stored
```

Example query:

```sql
SELECT *
FROM audit_logs
ORDER BY log_id;
```

The current trigger records the status change and its description. The known implementation inserts a NULL `user_id`, so it does not yet identify the authenticated person who performed the change.

---

## 12. Installation and Execution

### 12.1 Prerequisites

Install the following software:

- Node.js and npm
- PostgreSQL 18
- MongoDB, if running the MongoDB component locally
- MongoDB Compass (optional database GUI)
- Git
- Visual Studio Code (recommended)

### 12.2 Clone the Repository

```powershell
git clone https://github.com/Prashantnaik333/Smart_Research_and_Peer_Review_Portal.git
```

Open the project:

```powershell
cd Smart_Research_and_Peer_Review_Portal
```

### 12.3 Install Dependencies

```powershell
npm install
```

### 12.4 Configure Environment Variables

Create a `.env.local` file in the project root.

Example:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=smartportal_db
PGUSER=postgres
PGPASSWORD=YOUR_POSTGRES_PASSWORD

AUTH_SECRET=YOUR_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
```

Replace the example values with your own local configuration.

**Security:** Never upload `.env.local`, database passwords, authentication secrets, or real credentials to GitHub.

### 12.5 Start PostgreSQL

Make sure your PostgreSQL service is running and the `smartportal_db` database is available with the required schema and data.

Connect using PowerShell:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d smartportal_db
```

### 12.6 Start the Application

Run:

```powershell
npm run dev
```

Open the application:

```text
http://localhost:3000
```

Student dashboard:

```text
http://localhost:3000/student/dashboard
```

The student dashboard requires an authenticated student session.

**Database setup note:** The database schema and any required sample data must be created before running the application. Use the SQL setup scripts provided in the repository, if included.

---

## 13. Project Folder Structure

The main project structure is:

```text
Smart_Research_and_Peer_Review_Portal/
│
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   ├── assignments/
│   │   ├── auth/
│   │   ├── discussions/
│   │   ├── manuscripts/
│   │   ├── reviewers/
│   │   ├── reviews/
│   │   └── student/
│   │
│   ├── assignments/
│   ├── discussions/
│   ├── login/
│   ├── manuscripts/
│   ├── register/
│   ├── reports/
│   ├── reviewers/
│   ├── reviews/
│   ├── student/
│   └── submit/
│
├── components/
│
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   └── mongodb.ts
│
├── public/
│
├── .gitignore
├── middleware.ts
├── package.json
├── package-lock.json
└── README.md
```

The folder tree describes the main application organization. It should be updated if the actual project structure changes.

---

## 14. Testing and Validation

The following checks should be completed before final submission.

- [ ] PostgreSQL service starts successfully.
- [ ] `smartportal_db` database exists.
- [ ] All nine physical PostgreSQL tables are present.
- [ ] Primary key and foreign key relationships are valid.
- [ ] Next.js application starts successfully.
- [ ] User registration works.
- [ ] User login works.
- [ ] Student manuscript submission works.
- [ ] Reviewer assignment works.
- [ ] Reviewer evaluation can be submitted.
- [ ] Review information is stored in PostgreSQL.
- [ ] Student dashboard retrieves the correct review records.
- [ ] Students cannot access other students' review records.
- [ ] Manuscript status changes create audit records.
- [ ] MongoDB discussion documents can be viewed and queried.

---

## 15. Security Considerations

- Store passwords as secure password hashes, never as plaintext.
- Keep database credentials in environment variables.
- Use a strong authentication secret.
- Use parameterized SQL queries.
- Verify authentication sessions on protected API routes.
- Restrict student review access using the authenticated student's ID.
- Do not expose one student's evaluation records to another student.
- Never publish passwords, authentication secrets, or private user information in GitHub.

---

## 16. Future Enhancements

The following features can be considered for future development:

1. Email notifications for reviewer assignments and review completion.
2. Advanced reviewer allocation based on research expertise.
3. More detailed research analytics and reporting.
4. Improved reviewer workload management.
5. Exportable review reports.
6. Improved audit history with authenticated user identification.
7. Semantic research paper search using vector embeddings.
8. Enhanced administrative dashboards.
9. Integration of plagiarism-detection services.

Vector-based semantic search is a proposed enhancement and should not be considered operational until successfully implemented and tested.

---

## 17. Conclusion

The **Smart Research & Peer Review Portal** demonstrates how database management concepts can be applied to a practical academic research management problem.

The system uses PostgreSQL to manage structured information about users, departments, manuscripts, research topics, reviewers, assignments, reviews, and audit records.

MongoDB provides document-oriented storage for review discussion information.

The Next.js application provides a centralized interface for research submission, reviewer management, evaluation, and feedback access.

The project demonstrates important DBMS concepts such as relational schema design, primary keys, foreign keys, constraints, SQL JOINs, aggregate functions, views, functions, triggers, transactions, ACID properties, normalization, and parameterized queries.

Overall, the project illustrates the practical use of relational and NoSQL databases in developing an academic research management system.

---

## 18. GitHub Repository

**Repository Link:**

https://github.com/Prashantnaik333/Smart_Research_and_Peer_Review_Portal

**Project Title:** Smart Research & Peer Review Portal

**Institution:** PES University

**Department:** Computer Science and Engineering

**Academic Year:** 2026–2027

### Team Members

**1. Prashant Devendra Naik**

SRN: PES1UG24AM199

**2. Pradyun P Urs**

SRN: PES1UG24AM195

---

**Smart Research & Peer Review Portal**  
PES University | Computer Science and Engineering  
Academic Year 2026–2027
