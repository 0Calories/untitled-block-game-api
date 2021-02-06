### Setup
1. You need to install NodeJS - https://nodejs.org/en/.
2. Run `npm install -g yarn` to get the yarn package manager
3. Clone this repo using the github link
4. Run `yarn` in the repo location to install the required dependencies.

### Instructions for when changing database schema

- Modify prisma/schema.prisma with new DB changes
- Run ```prisma migrate dev --preview-feature```
- Generate a new Prisma client by running ```npx prisma generate```

### How to clone DB
 - https://dba.stackexchange.com/questions/10474/postgresql-how-to-create-full-copy-of-database-schema-in-same-database
