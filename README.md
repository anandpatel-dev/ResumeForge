# ResumeForge

ResumeForge is a web-based resume and career toolkit designed to help users build resumes, evaluate ATS compatibility, and compare resumes with job descriptions.

## Features

- **Resume Builder** – Create and customize resumes using available templates.
- **ATS Checker** – Analyze resumes for ATS-related compatibility.
- **Job Description Matcher** – Compare a resume with a job description.
- **AI Career Assistant** – Get career-related assistance.
- **User Authentication** – Register and log in to access the application.

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS

**Backend**
- Python
- Flask
- SQLAlchemy
- JWT Authentication

**Other Tools**
- SQLite
- Node.js / npm

## Project Structure

```text
ResumeForge/
├── backend/
│   ├── routes/
│   ├── resume_templates/
│   ├── app.py
│   ├── resume_api.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/anandpatel-dev/ResumeForge.git
cd ResumeForge
```

### 2. Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

**Windows Git Bash**
```bash
source .venv/Scripts/activate
```

Install dependencies and start Flask:

```bash
pip install -r requirements.txt
python app.py
```

Configure the required environment variables in a local `backend/.env` file.

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run frontend
```

Open the local frontend URL shown in your terminal, usually `http://localhost:5173`.

## Environment Variables

Keep secrets in local environment files or your deployment provider's environment settings. Never commit `.env` files.

## Project Status

Under development. Features and deployment configuration may evolve.