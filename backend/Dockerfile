FROM continuumio/miniconda3

WORKDIR /app

# Install system libraries needed by various python packages
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 1. Clean requirements.txt: Remove packages we will install via Conda
# This prevents pip from trying to compile them or overwriting them
RUN sed -i '/dlib/d' requirements.txt && \
    sed -i '/numpy/d' requirements.txt && \
    sed -i '/pillow/d' requirements.txt && \
    sed -i '/opencv-python/d' requirements.txt

# 2. Install heavy dependencies via Conda (Pre-compiled binaries)
# - dlib: The main pain point (requires heavy C++ compilation)
# - numpy: Core math library, compiling it requires gcc/gfortran
# - pillow: Image processing
# - opencv: Computer vision (replaces opencv-python)
RUN conda install -y -c conda-forge \
    dlib \
    numpy \
    pillow \
    opencv \
    && conda clean -afy

# 3. Install remaining python packages via pip
# (fastapi, uvicorn, face-recognition, etc.)
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
