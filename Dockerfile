# Use a lightweight Python image
FROM python:3.11-alpine

# Set the working directory
WORKDIR /usr/src/harness

# Prevent Python from writing pyc files and keep stdout unbuffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies first (for optimal Docker layer caching)
COPY pyproject.toml HARNESS_README.md ./
RUN pip install --no-cache-dir .

# Copy your harness script and any local suite files
COPY annotation_harness.py .
COPY annotations/ annotations/

# Define the entry point
ENTRYPOINT ["python", "annotation_harness.py"]
