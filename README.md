# Untitled Block Game
Welcome to the Untitled Block Game API repository!
For full instructions on setting up a dev environment and more, check out the [Wiki](https://github.com/0Calories/untitled-block-game-api/wiki) 

## Quick tingz
Here are some commands you will use frequently when developing the API:

### Updating your local DBs after modifying schema.prisma
Development DB:
`yarn update-db`

Testing DB:
`yarn update-db-test`

All DBs:
`yarn update-dbs`

Don't forget to regenerate your Prisma client after making changes to the schema:
`npx prisma generate`

## Side notes
 - [How to clone DB](https://dba.stackexchange.com/questions/10474/postgresql-how-to-create-full-copy-of-database-schema-in-same-database)
