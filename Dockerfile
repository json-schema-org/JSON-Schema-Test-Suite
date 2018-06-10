FROM node:10.4.0

# Install Python.
RUN apt-get update && apt-get install -y \
    python2.7 \
    python-pip \
 && rm -rf /var/lib/apt/lists/* \
 && pip install -U "tox" \
 && npm i npm

# Define working directory.
WORKDIR /src

# Define default command.
CMD ["bash"]
