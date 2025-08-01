# Sample application using custom cache implementation

This is a simple Node.js application to demonstrate how to use your cache implementation in ConfigCat. The `configcat-redis-cachejs` file shows how you can create a simple adapter for Redis cache.

## Install dependencies

```
npm i
```

## Run web application on local machine

### Setup Redis

The easiest way to get a Redis instance on your machine is a Docker-based solution.

1. Pull the latest Docker image for Redis

```
docker pull redis
```

2. Run the container

```
docker run --name container-redis -p 6379:6379 -d redis
```

### Start console application

```
npm start
```
