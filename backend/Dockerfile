FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    pkg-config \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Download pre-built dlib wheel to avoid compilation
# This wheel is for Python 3.10 on Linux x86_64
RUN wget https://github.com/m-bain/whisperX/releases/download/v3.0.0/dlib-19.24.2-cp310-cp310-linux_x86_64.whl

COPY requirements.txt .

# Modify requirements to exclude dlib causing compilation
RUN sed -i '/dlib/d' requirements.txt

# Install dlib from wheel first, then other requirements
RUN pip install dlib-19.24.2-cp310-cp310-linux_x86_64.whl
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
