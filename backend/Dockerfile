FROM python:3.10-slim

# Install system dependencies including cmake
# Debian Bookworm (slim default) has CMake 3.25 which is compatible with dlib
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

# Install build tools, but NOT cmake (use system cmake)
RUN pip install --no-cache-dir scikit-build wheel setuptools

# Modify requirement file temporarily to handle dlib separately
RUN sed -i '/dlib/d' requirements.txt

# Install dlib 19.24.4 (Standard version)
# Using system cmake prevents the "Compatibility < 3.5 removed" error from newer pip cmake
RUN pip install --no-cache-dir dlib==19.24.4

# Install remaining requirements
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
