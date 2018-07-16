FROM node:10.4.0

RUN apt-get update && apt-get install -y python2.7 python-pip && \
    rm -rf /var/lib/apt/lists/*
RUN pip install -U "tox"
RUN npm install npm
