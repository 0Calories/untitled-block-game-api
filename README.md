### Recommended VSCode Extensions
- GitLens
- GraphQL for VSCode
- npm
- npm Intellisense
- Prisma

### Very initial setup
1. You need to install NodeJS - https://nodejs.org/en/.
2. Run `npm install -g yarn` to get the yarn package manager
3. Clone this repo using the github link
4. Run `yarn` in the repo location to install the required dependencies.

### How to setup a local Postgres database
- Create a new database using pgAdmin or the command line
- Navigate to the prisma directory in the project root
- Create a '.env' file
- Add the environment variable for the databse URL, replacing the username, password, and db with your credentials:
```DATABASE_URL=postgresql://janedoe:mypassword@localhost:5432/mydb``` 
- Run ```npx prisma migrate dev --preview-feature```
- Generate a new Prisma client by running ```npx prisma generate```

### Running the API locally
- At this point, you should have a local database ready to go. You can test out the API by doing the following:
- Run ```yarn dev```. When the console tells you the server is up, go to ```http://localhost:4000/``` to view the GraphQL playground

### Instructions for when making changes to the database schema
- Modify prisma/schema.prisma with new DB changes
- Run ```npx prisma migrate dev --preview-feature```
- Generate a new Prisma client by running ```npx prisma generate```

### How to clone DB
 - https://dba.stackexchange.com/questions/10474/postgresql-how-to-create-full-copy-of-database-schema-in-same-database
