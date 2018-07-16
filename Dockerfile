FROM node:alpine

# Install Python.
RUN apk add --no-cache bash python && \
    python -m ensurepip && \
    rm -r /usr/lib/python*/ensurepip && \
    pip install --upgrade pip setuptools && \
    rm -r /root/.cache

RUN pip install -U "tox"

# Define working directory.
WORKDIR /src

# Define default command.
CMD ["bash"]
