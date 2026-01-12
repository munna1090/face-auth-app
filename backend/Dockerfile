FROM python:3.10-slim

# Install minimal system dependencies
# We don't need cmake/build-essential if we use the wheel!
RUN apt-get update && apt-get install -y \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    pkg-config \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# 1. Remove dlib from requirements.txt to prevent pip from trying to compile it
RUN sed -i '/dlib/d' requirements.txt

# 2. Install dlib from a specific pre-built wheel (PyPI hosted, reliable)
# This bypasses the compilation step completely
RUN pip install https://files.pythonhosted.org/packages/b7/c1/8141f237f815e1974d6f831f24d7768565b1c1e95c1c834f3c7845f1b5c9/dlib_bin-19.24.2-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl

# 3. Install other requirements
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
