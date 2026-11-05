# SMART RESEARCH & PEER REVIEW PORTAL

### A Hybrid SQL and NoSQL-Based Academic Research Management System

**Institution:** PES University  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–2027

---

# 1. PROJECT OVERVIEW

The Smart Research & Peer Review Portal is a web-based academic research management system designed to simplify research paper submission, reviewer allocation, evaluation, and feedback management.

The system provides a centralized platform where students can submit research manuscripts, administrators can assign reviewers, and reviewers can evaluate manuscripts by providing scores, comments, and recommendations.

Students can view their submitted manuscripts and reviewer feedback through their dashboard.

## Project Workflow

1. Student registers and logs in.
2. Student submits a research manuscript.
3. Administrator or coordinator assigns a reviewer.
4. Reviewer evaluates the submitted manuscript.
5. Reviewer provides technical and originality scores.
6. Reviewer submits comments and recommendations.
7. Student views the evaluation results in the Student Reviews Dashboard.

---

# 2. MAIN FEATURES

- User registration and login.
- Role-based authentication.
- Student manuscript submission.
- Manuscript management.
- Reviewer profile management.
- Reviewer assignment.
- Research paper evaluation.
- Technical and originality scoring.
- Reviewer comments and recommendations.
- Student review dashboard.
- PostgreSQL relational database.
- Audit logging for manuscript status changes.

**Note:** MongoDB integration and pgvector semantic search should be described as completed only after they are successfully connected and demonstrated.

---

# 3. TECHNOLOGY STACK

| Technology | Purpose |
|---|---|
| Next.js | Frontend and backend framework |
| React.js | User interface |
| TypeScript | Application development |
| Tailwind CSS | UI styling |
| Node.js | Runtime environment |
| PostgreSQL 18 | Relational database |
| pg | PostgreSQL database connection |
| jose | JWT-based session management |
| bcrypt/bcryptjs | Password hashing and verification, depending on the implemented login code |
| MongoDB | Planned/additional NoSQL storage |
| pgvector | Planned vector similarity search |

---

# 4. PROJECT FOLDER STRUCTURE

```text
dbmsminiproject/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── route.ts
│   │   │
│   │   └── student/
│   │       └── dashboard/
│   │           └── route.ts
│   │
│   └── student/
│       └── dashboard/
│           └── page.tsx
│
├── components/
│
├── lib/
│   ├── auth.ts
│   └── db.ts
│
├── public/
│
├── .env.local
├── middleware.ts
├── package.json
├── next.config.ts
└── README.md
```

## Important Files

**lib/db.ts**

Establishes the PostgreSQL database connection using the pg package.

**lib/auth.ts**

Handles authentication sessions using JWT and cookies.

**app/api/auth/login/route.ts**

Handles user login and retrieves account information from PostgreSQL.

**app/api/student/dashboard/route.ts**

Retrieves reviewer scores and feedback belonging to the authenticated student.

**app/student/dashboard/page.tsx**

Displays the student's reviewer evaluations, scores, comments, and recommendations.

---

# 5. DATABASE SETUP

The project uses PostgreSQL 18.

Database name:

```sql
smartportal_db
```

Create the database if it does not already exist:

```sql
CREATE DATABASE smartportal_db;
```

Connect to PostgreSQL using PowerShell:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d smartportal_db
```

To display all tables:

```sql
\dt
```

To display a table structure:

```sql
\d users
```

## 5.1 DATABASE TABLES

The project contains nine physical PostgreSQL tables.

| No. | Table Name | Description |
|---|---|---|
| 1 | departments | Stores department information |
| 2 | users | Stores student, reviewer, and administrator accounts |
| 3 | research_topics | Stores research topic information |
| 4 | manuscripts | Stores submitted research papers |
| 5 | reviewers | Stores reviewer profiles and expertise |
| 6 | manuscript_topics | Connects manuscripts with research topics |
| 7 | assignments | Stores reviewer assignments |
| 8 | reviews | Stores reviewer scores and feedback |
| 9 | audit_logs | Stores system activity records |

The database also contains a view named:

```sql
manuscript_review_summary
```

A view is not a physical table.

---

# 6. DATABASE RELATIONSHIPS

The important foreign-key relationships are:

```text
departments
    |
    | department_id
    |
    v
users
    |
    | user_id
    |
    v
manuscripts
    |
    | manuscript_id
    |
    v
assignments
    |
    | assignment_id
    |
    v
reviews
```

Additional relationships:

```text
users
  |
  v
reviewers
  |
  v
assignments
```

```text
manuscripts
     |
     v
manuscript_topics
     |
     v
research_topics
```

## Foreign Keys

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

---

# 7. ENVIRONMENT CONFIGURATION

Create a `.env.local` file in the project root.

Example configuration:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=smartportal_db
PGUSER=postgres
PGPASSWORD=YOUR_POSTGRES_PASSWORD

AUTH_SECRET=YOUR_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
```

Replace the example values with your own credentials.

**Security:** Never upload `.env.local`, database passwords, authentication secrets, or real user password hashes to GitHub.

Restart the Next.js server after changing environment variables.

---

# 8. INSTALLATION AND EXECUTION

Open PowerShell in the project folder.

Install dependencies:

```powershell
npm install
```

Start the Next.js development server:

```powershell
npm run dev
```

Open the application:

```text
http://localhost:3000
```

Student Reviews Dashboard:

```text
http://localhost:3000/student/dashboard
```

The student must log in before accessing the protected dashboard.

---

# 9. POSTGRESQL CONNECTION

The database connection is implemented in:

```text
lib/db.ts
```

Complete connection code:

```typescript
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

export default pool;
```

The `Pool` class manages PostgreSQL database connections.

Other backend files import this connection and execute SQL queries.

Example:

```typescript
import pool from "@/lib/db";

const result = await pool.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);
```

The `$1` placeholder is used for parameterized queries.

Parameterized queries help protect the application against SQL injection.

---

# 10. STUDENT REVIEW DASHBOARD

The Student Reviews Dashboard allows students to view evaluations submitted by reviewers.

Backend API:

```text
app/api/student/dashboard/route.ts
```

Frontend page:

```text
app/student/dashboard/page.tsx
```

The backend retrieves:

1. Manuscript title.
2. Reviewer name.
3. Technical score.
4. Originality score.
5. Average score.
6. Reviewer comments.
7. Final recommendation.
8. Review submission date.

## Database Relationship Used

```text
USERS
  |
  | user_id
  |
MANUSCRIPTS
  |
  | manuscript_id
  |
ASSIGNMENTS
  |
  | assignment_id
  |
REVIEWS
```

Reviewer information is retrieved through:

```text
ASSIGNMENTS
    |
    | reviewer_id
    |
REVIEWERS
    |
    | user_id
    |
USERS
```

## SQL JOIN Query Used

```sql
SELECT
    rv.review_id,
    rv.assignment_id,
    m.manuscript_id,
    m.title AS manuscript_title,
    reviewer_user.full_name AS reviewer_name,
    rv.technical_score,
    rv.originality_score,

    CASE
        WHEN rv.technical_score IS NOT NULL
         AND rv.originality_score IS NOT NULL
        THEN ROUND(
            (rv.technical_score + rv.originality_score) / 2,
            2
        )
        ELSE NULL
    END AS average_score,

    rv.review_comments,
    rv.recommendation,
    rv.reviewed_at

FROM reviews rv

INNER JOIN assignments a
    ON rv.assignment_id = a.assignment_id

INNER JOIN manuscripts m
    ON a.manuscript_id = m.manuscript_id

INNER JOIN reviewers r
    ON a.reviewer_id = r.reviewer_id

INNER JOIN users reviewer_user
    ON r.user_id = reviewer_user.user_id

WHERE m.student_id = $1

ORDER BY rv.reviewed_at DESC;
```

The `$1` parameter must be supplied using the authenticated student's session ID.

This prevents a student from accessing another student's review records by changing a browser parameter.

---

# 11. SQL AND DBMS CONCEPTS USED

The following DBMS concepts are implemented or demonstrated in the project.

## 11.1 DDL – DATA DEFINITION LANGUAGE

DDL is used to create and modify database structures.

Commands:

```sql
CREATE
ALTER
DROP
TRUNCATE
```

Example:

```sql
CREATE TABLE departments (
    department_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Purpose:

To define tables, columns, data types, and constraints.

## 11.2 DML – DATA MANIPULATION LANGUAGE

DML is used to insert, update, and delete records.

INSERT:

```sql
INSERT INTO research_topics
(topic_name, description)
VALUES
('Artificial Intelligence', 'AI research topics');
```

UPDATE:

```sql
UPDATE manuscripts
SET status = 'UNDER_REVIEW'
WHERE manuscript_id = 1;
```

DELETE:

```sql
DELETE FROM research_topics
WHERE topic_id = 5;
```

Purpose:

To manage records stored in the database.

## 11.3 DQL – DATA QUERY LANGUAGE

DQL retrieves data from database tables.

Example:

```sql
SELECT *
FROM manuscripts;
```

Purpose:

To retrieve student, manuscript, reviewer, and review information.

## 11.4 PRIMARY KEY

A primary key uniquely identifies each record in a table.

Example:

```sql
user_id
```

Purpose:

To uniquely identify users and other records.

## 11.5 FOREIGN KEY

A foreign key connects two related tables.

Example:

```sql
FOREIGN KEY (student_id)
REFERENCES users(user_id)
```

Purpose:

To maintain relationships and referential integrity between tables.

## 11.6 CONSTRAINTS

Constraints enforce rules on database records.

Examples:

```sql
PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
DEFAULT
```

Project examples:

- `users.email` is UNIQUE.
- `users.full_name` is NOT NULL.
- `departments.department_code` is UNIQUE.
- `created_at` has a default timestamp.

Purpose:

To prevent invalid and duplicate data.

## 11.7 JOINS

JOIN combines information from multiple related tables.

Example:

```sql
SELECT
    m.title,
    u.full_name,
    m.status
FROM manuscripts m
INNER JOIN users u
ON m.student_id = u.user_id;
```

Purpose:

To retrieve related information from different tables.

In the Student Dashboard, JOIN is used to retrieve manuscript titles, reviewer names, scores, and feedback.

## 11.8 AGGREGATE FUNCTIONS

Aggregate functions perform calculations on multiple records.

Important functions:

```sql
COUNT()
SUM()
AVG()
MIN()
MAX()
```

Example:

```sql
SELECT AVG(technical_score)
FROM reviews;
```

Purpose:

To calculate evaluation statistics and generate reports.

## 11.9 GROUP BY

GROUP BY groups records based on a column.

Example:

```sql
SELECT
    status,
    COUNT(*) AS total_manuscripts
FROM manuscripts
GROUP BY status;
```

Purpose:

To count manuscripts according to their review status.

## 11.10 VIEWS

A view is a saved SQL query that behaves like a virtual table.

Project view:

```text
manuscript_review_summary
```

Display the view:

```sql
SELECT *
FROM manuscript_review_summary;
```

List all views:

```sql
\dv
```

Purpose:

To simplify complex queries and make reporting easier.

## 11.11 FUNCTIONS

A PostgreSQL function stores reusable database logic.

Project function:

```text
log_manuscript_status_change()
```

List functions:

```sql
\df
```

Purpose:

To reuse database logic without writing the same operations repeatedly.

## 11.12 TRIGGERS

A trigger automatically executes when a database event occurs.

Project trigger:

```text
manuscript_status_audit_trigger
```

It runs after an UPDATE on the `manuscripts` table.

Example:

```sql
UPDATE manuscripts
SET status = 'UNDER_REVIEW'
WHERE manuscript_id = 1;
```

The trigger calls the function:

```text
log_manuscript_status_change()
```

The function inserts a record into:

```text
audit_logs
```

Purpose:

To maintain automatic audit history when manuscript status changes.

## 11.13 TRANSACTIONS

A transaction groups multiple database operations into one logical unit.

Commands:

```sql
BEGIN;
COMMIT;
ROLLBACK;
```

Example:

```sql
BEGIN;

UPDATE manuscripts
SET status = 'UNDER_REVIEW'
WHERE manuscript_id = 1;

COMMIT;
```

Purpose:

To maintain consistency when performing related database operations.

This is a transaction example; explicit transaction use in every application workflow should be verified separately.

## 11.14 ACID PROPERTIES

ACID describes the reliability properties of database transactions.

| Property | Meaning | Project Example |
|---|---|---|
| Atomicity | All operations succeed or none do | Related database updates |
| Consistency | Database rules remain valid | Foreign key constraints |
| Isolation | Concurrent transactions are controlled | Multiple administrators |
| Durability | Committed data persists | Saved review records |

## 11.15 NORMALIZATION

Normalization organizes database tables to reduce unnecessary duplication.

Example:

Instead of storing department names repeatedly in user records, the project maintains separate tables:

```text
DEPARTMENTS
department_id
department_name
```

```text
USERS
user_id
full_name
department_id
```

Purpose:

To reduce data duplication and improve consistency.

Exact normal forms should be verified against the complete schema and functional dependencies.

## 11.16 COMPOSITE PRIMARY KEY

A composite primary key uses multiple columns together to uniquely identify a record.

Project example:

```sql
PRIMARY KEY (manuscript_id, topic_id)
```

This is used in:

```text
manuscript_topics
```

Purpose:

To prevent duplicate manuscript-topic relationships.

## 11.17 PARAMETERIZED QUERIES

Parameterized queries pass values separately from SQL statements.

Example:

```typescript
await pool.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);
```

Purpose:

To protect SQL queries from injection attacks.

---

# 12. TRIGGER AND FUNCTION IMPLEMENTATION

The project has an audit trigger and function.

Function name:

```text
log_manuscript_status_change()
```

Trigger name:

```text
manuscript_status_audit_trigger
```

Inspect triggers:

```sql
SELECT
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing
FROM information_schema.triggers;
```

Inspect the function:

```sql
SELECT pg_get_functiondef(
    'public.log_manuscript_status_change()'::regprocedure
);
```

The known function records status changes in `audit_logs` with a NULL user ID. It does not currently establish which authenticated user performed the change.

---

# 13. MONGODB AND VECTOR SEARCH

PostgreSQL is the confirmed relational database used in the project.

MongoDB was included in the planned hybrid database design for flexible document-oriented data, such as discussions or messages.

Before claiming MongoDB integration as completed, verify:

- MongoDB database name.
- Collection names.
- Application connection.
- Insert, read, update, and delete operations.

The pgvector extension was previously blocked by a Windows application-control policy when PostgreSQL attempted to load `vector.dll`.

Do not claim semantic vector search is operational until:

```sql
CREATE EXTENSION vector;
```

executes successfully and a vector query is demonstrated.

---

# 14. USEFUL POSTGRESQL COMMANDS

Connect to the database:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d smartportal_db
```

List all tables:

```sql
\dt
```

Display table structure:

```sql
\d users
```

Display users:

```sql
SELECT * FROM users;
```

Display manuscripts:

```sql
SELECT * FROM manuscripts;
```

Display assignments:

```sql
SELECT * FROM assignments;
```

Display reviews:

```sql
SELECT * FROM reviews;
```

Display audit logs:

```sql
SELECT * FROM audit_logs;
```

List views:

```sql
\dv
```

List functions:

```sql
\df
```

List indexes:

```sql
\di
```

---

# 15. TESTING CHECKLIST

- [ ] PostgreSQL service is running.
- [ ] `smartportal_db` database exists.
- [ ] All nine physical tables are present.
- [ ] Next.js application starts successfully.
- [ ] Student login works.
- [ ] Student can submit a manuscript.
- [ ] Reviewer assignments can be created.
- [ ] Reviewer can submit an evaluation.
- [ ] Review record is saved in PostgreSQL.
- [ ] Student can open the review dashboard.
- [ ] Student sees only their own reviews.
- [ ] Technical score displays correctly.
- [ ] Originality score displays correctly.
- [ ] Reviewer comments display correctly.
- [ ] Recommendation displays correctly.
- [ ] Manuscript status changes create audit records.

---

# 16. SCREENSHOTS TO INCLUDE IN THE PROJECT REPORT

Capture actual screenshots from the running application and PostgreSQL terminal.

Recommended screenshots:

1. PostgreSQL terminal showing all nine tables using `\dt`.
2. Users table structure using `\d users`.
3. Manuscripts table structure using `\d manuscripts`.
4. Assignments table structure using `\d assignments`.
5. Reviews table structure using `\d reviews`.
6. SQL JOIN query output.
7. Audit logs using `SELECT * FROM audit_logs;`.
8. Trigger and function definitions.
9. Student login page.
10. Student manuscript submission page.
11. Reviewer evaluation page.
12. Student Scores & Feedback dashboard showing actual review records.

Use actual application data. Do not invent scores or reviewer feedback for screenshots.

---

# 17. SECURITY CONSIDERATIONS

- Passwords must be stored as secure password hashes, never plaintext.
- Database credentials must remain inside `.env.local`.
- Use a strong `AUTH_SECRET`.
- Use parameterized SQL queries.
- Verify the authenticated session on protected API routes.
- Restrict student review access using the authenticated student's ID.
- Do not expose another student's evaluation records.
- Do not publish passwords, password hashes, or private information in screenshots or GitHub.

---

# 18. PROJECT CONCLUSION

The Smart Research & Peer Review Portal demonstrates the use of database management concepts in an academic research management application.

PostgreSQL stores structured information about users, departments, manuscripts, research topics, reviewers, assignments, reviews, and audit logs.

The Next.js backend communicates with PostgreSQL using the `pg` connection pool and SQL queries.

The project demonstrates primary keys, foreign keys, constraints, joins, aggregate functions, views, functions, triggers, transactions, normalization principles, and parameterized queries.

The Student Reviews Dashboard demonstrates how multiple relational tables can be joined to retrieve reviewer evaluations and display technical scores, originality scores, comments, and recommendations to the correct student.

---

**PROJECT TITLE:** Smart Research & Peer Review Portal

**INSTITUTION:** PES University

**DEPARTMENT:** Computer Science and Engineering

**ACADEMIC YEAR:** 2026–2027
