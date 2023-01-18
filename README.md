# Challenge for Brasil Startups

## How to


Install dependencies

```
npm install
```

Setup env for prisma

```
cp .env.example .env
```

Run mongo using docker-compose (prisma needs replicaSet for MongoDB)

```
docker-compose run -d

or

sudo docker-compose run -d
```

Setup prisma

```
npx prisma generate
```

Run start for seeding the database with the source's data

```
npm start
```

Run serve to view the structured data saved on MongoDB as an API

```
npm run serve
```

Link:
http://localhost:3000/notices/




