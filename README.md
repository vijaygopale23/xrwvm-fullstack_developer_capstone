# Cars Dealership Full Stack Application

**Repository Name:** xrwvm-fullstack_developer_capstone

**Project Name:** IBM Full Stack Application Development Capstone Project

## Description

A full-stack Cars Dealership web application that allows users to view dealership locations, explore dealer details, register and log in, and submit dealership reviews.

## Run locally

Requirements: Python 3.11+, Node.js 20+, npm, and Docker with Docker Compose.

1. Build the React app and install the Django requirements:

   ```powershell
   cd server\frontend
   npm ci
   npm run build
   cd ..\
   python -m pip install -r requirements.txt
   ```

2. Set a development-only Django secret and start MongoDB, the dealership API,
   sentiment analyzer, and Django:

   ```powershell
   $env:DJANGO_SECRET_KEY = "replace-with-a-local-development-secret"
   docker compose up --build
   ```

3. Open `http://localhost:8000`. Create an application account using Register.
   Create an administrator account in another terminal with
   `docker compose exec web python manage.py createsuperuser` from the `server`
   directory.

The `backend_url` and `sentiment_analyzer_url` settings can be overridden with
environment variables for deployed services. For production, set
`DJANGO_DEBUG=false`, `DJANGO_SECRET_KEY`, and `DJANGO_ALLOWED_HOSTS` to values
appropriate to the deployment environment.

The Actions workflow in `.github/workflows/ci.yml` checks the Django project,
builds the frontend, and checks the dealership API JavaScript syntax.
