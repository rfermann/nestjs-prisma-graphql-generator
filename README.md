# NestJS-Prisma-GraphQL-Generator

NestJS-Prisma-GraphQL-Generator tool for generating GraphQL resolvers for your NestJS application based on the prisma schema of your project.

## Prerequisites

Before you begin, ensure you have met the following requirements:

<!--- These are just example requirements. Add, duplicate or remove as required --->

- Your project uses the latest version of Prisma and NestJS

## Installing NestJS-Prisma-GraphQL-Generator

To install NestJS-Prisma-GraphQL-Generator, follow these steps:

```
npm i nestjs-prisma-graphql-generator --save-dev
```

or

```
yarn add nestjs-prisma-graphql-generator --dev
```

## Using NestJS-Prisma-GraphQL-Generator

To use NestJS-Prisma-GraphQL-Generator, follow these steps:

1. configure the prisma generator
2. add NestJS-Prisma-GraphQL-Generator as a subsequent generator to your prisma.schema
3. optionally configure NestJS-Prisma-GraphQL-Generator as described in the [Configuration](#configuration) section
4. run prisma generate

## Configuration

Create a new generator in your prisma schema:

```
generator nestjs {
  provider = "nestjs-prisma-graphql"
}
```

## Currently supported objects

- Enums
- Models
- Input Types

## Usage

All supported objects can be used as the regular NestJS GraphQL object equivalents.

## Upcoming features

- Output Types
- Resolvers
- [Prisma Select](https://paljs.com/plugins/select/) integration

## Contributing to NestJS-Prisma-GraphQL-Generator

To contribute to NestJS-Prisma-GraphQL-Generator, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin nestjs-prisma-graphql-generator/main`
5. Create the pull request.

Alternatively see the GitHub documentation on [creating a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

## Contributors

Thanks to the following people who have contributed to this project:

- [@rfermann](https://github.com/rfermann)

## License

This project uses the MIT license.
