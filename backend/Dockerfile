FROM continuumio/miniconda3

WORKDIR /app

# Install system libraries required by OpenCV
RUN apt-get update && apt-get install -y libgl1-mesa-glx && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 1. Remove dlib from pip requirements (we install it via conda)
RUN sed -i '/dlib/d' requirements.txt

# 2. Install pre-compiled dlib from conda-forge (Solves OOM & Compilation time)
RUN conda install -y -c conda-forge dlib

# 3. Install remaining python packages via pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
