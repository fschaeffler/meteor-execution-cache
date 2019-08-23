# Meteor-Plugin: fschaeffler:execution-cache

## Purpose

This plugin helps with caching per one single execution, where different threads should not have access to the same content. Imagine an export-functionality within an application. You first want to retrieve all data in one bulk and then do the actual data transformation. If your data in your database is normalized, you have references within your data. In order to retrieve such references only once, this cache can get used.

**Data-Example:**

_Table: Users_

| ID  | First Name | Last Name |
| --- | ---------- | --------- |
| 1   | Charlie    | Root      |
| 2   | Foo        | Bar       |

_Table: Content_

| ID  | Content              | UserID |
| --- | -------------------- | ------ |
| 1   | This is some content | 2      |
| 2   | Another content      | 1      |
| 3   | Some more content    | 1      |

_Export: User Content_

| ID  | Content              | User First Name | User Last Name |
| --- | -------------------- | --------------- | -------------- |
| 1   | This is some content | Foo             | Bar            |
| 2   | Another content      | Charlie         | Root           |
| 3   | Some more content    | Charlie         | Root           |

For the export of _User Content_, we not only need the user's ID, but acutal values from the users-table.

## Installation

In order to use this plugin with a Meteor-application, just install it as a package via `meteor add fschaeffler:execution-cache`.

## Tests

-   code style: `npm run prettier`
-   JavaScript best practices: `npm run eslint`
-   unit tests: `npm run tests`

## package.js vs package.json

This package is a Meteor-package, which means the file `package.js` is getting used as entry point. However, for development-purposes, also NPM-dependencies and scripts are needed. Therefore, also a `package.json` is available.
