# Web Application (Frontend + Backend)

This project contains a web application with a React frontend and a Node.js (Express) backend.
It has been containerized using Docker for ease of deployment and development.

## Prerequisites

*   Docker: Make sure you have Docker installed on your system. You can download it from [https://www.docker.com/get-started](https://www.docker.com/get-started).
*   Docker Compose: Docker Compose is included with Docker Desktop for Windows and macOS. For Linux, you might need to install it separately. See [Docker Compose installation documentation](https://docs.docker.com/compose/install/).

## Running the Application with Docker Compose

1.  **Environment Variables for Backend:**
    The backend service requires an `OPENAI_API_KEY`. Create a file named `.env` in the `backend/` directory and add your API key:
    ```env
    OPENAI_API_KEY=your_actual_openai_api_key_here
    PORT=3001 
    ```
    Replace `your_actual_openai_api_key_here` with your valid OpenAI API key. The `PORT` is optional as it defaults to 3001.
    **Note:** This `.env` file is listed in `backend/.dockerignore` so it won't be included in the image if you build it for production without the volume mount, but `docker-compose.yml` as configured for development *will* try to make it available to the container if you uncomment the `env_file` directive or if you pass environment variables directly. For production, manage your secrets securely (e.g., through your deployment platform's secret management).

2.  **Build and Run the Containers:**
    Navigate to the root directory of the project (where `docker-compose.yml` is located) and run:
    ```bash
    docker-compose build
    ```
    This command builds the Docker images for both the frontend and backend services as defined in their respective `Dockerfile`s.

3.  **Start the Services:**
    After the build is complete, start the services:
    ```bash
    docker-compose up
    ```
    This command starts the frontend and backend containers.
    *   The frontend will be accessible at [http://localhost:80](http://localhost:80) (or simply `http://localhost`).
    *   The backend will be listening on port 3001 (e.g., API calls would go to `http://localhost:3001/api/...`).

4.  **To stop the services:**
    Press `Ctrl+C` in the terminal where `docker-compose up` is running. To remove the containers, run:
    ```bash
    docker-compose down
    ```

## Development

The `docker-compose.yml` is configured with volume mounts for both the `frontend` and `backend` services. This means that changes you make to the code on your local machine will be reflected inside the containers automatically, allowing for live reloading (if your frontend/backend development servers support it).

*   Frontend: `frontend/` is mounted to `/app` in the frontend container.
*   Backend: `backend/` is mounted to `/usr/src/app` in the backend container.

## Structure

*   `/frontend`: Contains the React/Vite frontend application.
*   `/backend`: Contains the Node.js/Express backend application.
*   `docker-compose.yml`: Defines how to run the multi-container application.
*   `README.md`: This file.
