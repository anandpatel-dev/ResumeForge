# 🚀 ResumeForge — AI-Powered Resume & Career Assistant

<p align="center">
  <strong>Build better resumes. Improve ATS compatibility. Get career-ready.</strong>
</p>

<p align="center">
  <a href="https://resume-forge-gf2q4fp6w-anandpatel9399454274-6514s-projects.vercel.app/">
    🌐 Live Demo
  </a>
  &nbsp; • &nbsp;
  <a href="https://github.com/anandpatel-dev/ResumeForge">
    💻 GitHub Repository
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Python-Backend-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-API-black?logo=flask" />
  <img src="https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-success" />
</p>

---

## 📌 About the Project

**ResumeForge** is a web-based resume and career assistance platform designed to help job seekers create professional resumes, evaluate ATS compatibility, and understand how well their resumes match specific job descriptions.

The platform combines resume-building tools, AI-assisted guidance, and resume analysis features in one place.

## ✨ Key Features

| Feature | Description |
|---|---|
| 📄 Resume Builder | Create and customize professional resumes using available templates. |
| 🎯 ATS Score Checker | Analyze resumes and identify areas for improvement in ATS compatibility. |
| 🔍 JD Matcher | Compare resumes against job descriptions and identify missing skills. |
| 🤖 AI Career Assistant | Get AI-powered career guidance and resume improvement suggestions. |
| 🔐 User Authentication | Register, log in, and access a personalized dashboard. |
| 📊 Dashboard | Access the platform's career tools from one place. |

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- Tailwind CSS
- JavaScript
- Axios

**Backend**
- Python
- Flask
- SQLAlchemy
- JWT Authentication
- REST APIs

**Database & Deployment**
- SQLite (local development)
- PostgreSQL (deployed backend)
- Vercel (frontend hosting)
- Render (backend hosting)

## 🏗️ Project Structure

```text
ResumeForge/
│
├── backend/
│   ├── routes/
│   ├── resume_templates/
│   ├── app.py
│   ├── resume_api.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Run Locally

### Prerequisites

- Python 3.10+
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/anandpatel-dev/ResumeForge.git
cd ResumeForge
```

### 2. Set Up the Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

**Windows (Git Bash)**

```bash
source .venv/Scripts/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required backend environment variables in your local `.env` file, then start Flask:

```bash
python app.py
```

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd ResumeForge/frontend
npm install
```

Create a frontend `.env` file and configure the backend API URL:

```env
VITE_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

Open the local frontend URL displayed in your terminal, usually:

`http://localhost:5173`

## 🌐 Live Deployment

| Component | Platform | Link |
|---|---|---|
| Frontend | Vercel | [Open Live App](https://resume-forge-gf2q4fp6w-anandpatel9399454274-6514s-projects.vercel.app/) |
| Backend | Render | [Backend Health Check](https://resumeforge-backend-uceb.onrender.com/api/health) |
| Source Code | GitHub | [View Repository](https://github.com/anandpatel-dev/ResumeForge) |

**Note:** The backend is hosted on Render's free instance, so the first request after inactivity may take longer while the service starts.

## 🔒 Environment Variables & Security

Keep sensitive configuration in environment variables.

- Never commit `.env` files.
- Never expose API keys, database credentials, or JWT secrets.
- Configure production environment variables through the hosting provider.
- Use the appropriate local and production API URLs.

## 🚧 Project Status

**Status: Deployed**

ResumeForge is deployed with its core features available. Further improvements and feature enhancements may be added over time.

## 👨‍💻 Developer

**Anand Patel**

B.Tech — Computer Science and Design

Interested in Data Analytics, Software Development, and AI.

- 💻 [GitHub Profile](https://github.com/anandpatel-dev)
- 🔗 [LinkedIn](https://linkedin.com/in/anand-patel-b37aa12b3)

---

<p align="center">
  ⭐ If you find this project interesting, consider giving it a star!
</p>
