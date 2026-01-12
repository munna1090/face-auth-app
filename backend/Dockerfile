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

COPY requirements.txt .

# Try to install from a different pre-built wheel source, or fall back to compilation
# Using a more generic approach: install cmake/scikit-build first to speed up compilation if needed
RUN pip install --no-cache-dir cmake scikit-build

# Modify requirement file temporarily to handle dlib separately
RUN sed -i '/dlib/d' requirements.txt

# Install dlib - attempting to use a known compatible version that might have a binary wheel
# or rely on the now-installed build tools to compile it faster
RUN pip install --no-cache-dir dlib==19.24.2

# Install remaining requirements
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
