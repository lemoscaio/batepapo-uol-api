<p align="center">
  <img  src="https://i.imgur.com/7gdt8lA.png"
    width=100%" >
</p>
<h1 align="center">
  EN: Uol Chat Room API / PT: Bate Papo Uol API
</h1>

<div align="center">

  <h3>Built With</h3>

  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" height="30px"/>  
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express.js&logoColor=white" height="30px"/>
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" height="30px"/>
  <img src="https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white" height="30px"/>
  <!-- Badges source: https://dev.to/envoy_/150-badges-for-github-pnk -->
</div>

<br/>

## Description

This is the API for a chat room that uses long polling and MongoDB. 

It was the 12ᵗʰ project of the Driven Full Stack Bootcamp.

##  Demo

<div align="center">
<img src="https://media4.giphy.com/media/lEMkRKT0DdU3EHfU68/giphy.gif?cid=790b76119795c78cbd3a76a53bc1587f7dc83b92b0e3b1cd&rid=giphy.gif&ct=g" height=350x>
</div>

## Features

- Users and messages persisted on the database (MongoDB)
- Unique user validation
- Private messages filtered through info passed via headers
- Schema validation for users and messages
- Full messages CRUD (create, read, update, delete)
- "User still online" validation through checking every X seconds
- Sanitization of all data passed through body, params and headers


## API Reference

### Participants

* Register new online participant
  
  ```http
  POST /participants
  ```

  ##### Request:

  | Body   | Type     | Description                   |
  | :----- | :------- | :---------------------------- |
  | `name` | `string` | **Required** - Valid username |

* Get all online participants

  ```http
  GET /participants
  ```

  #### Response:

  ```json
  [
    {
      "_id": "string",
      "name": "string",
      "lastStatus": "number"
    },
    {
      "_id": "string",
      "name": "string",
      "lastStatus": "number"
    }
  ]

### Messages

* Get all messages

  ```http
  GET /messages
  ```

  #### Query strings:

  | Parameter | description                    |
  | :-------- | :----------------------------- |
  | `limit`   | Quantity of messages to return |

  #### Headers:

  | Name   | Description |
  | :----- | :---------- |
  | `user` | username    |

  #### Response:

  ```json
  [
    {
      "_id": "string",
      "from": "string",
      "to": "string",
      "text": "string",
      "type": "string",
      "time": "22:51:55"
      "_time": "number"
    },
    {
      "_id": "string",
      "from": "string",
      "to": "string",
      "text": "string",
      "type": "string",
      "time": "string",
      "_time": "number"
    }
  ]
  ```
  `to: "Todos" or any participant name`

  `type: "status" | "message" | "private_message"`

* Post a new message

  ```http
  POST /messages
  ```

  #### Request body:

  ```json
  {
    "to": "string",
    "text": "string",
    "type": "string"
  } 
  ```

  `type: "message" | "private_message"`

  #### Headers:

  | Name   | Description             |
  | :----- | :---------------------- |
  | `user` | **Required** - Username |

* Delete message

  ```http
  DELETE /messages/{messageId}
  ```

  #### Path parameters:

  | Parameter   | description                            |
  | :---------- | :------------------------------------- |
  | `messageId` | **Required** - ID of message to delete |

  #### Headers:

  | Name   | Description             |
  | :----- | :---------------------- |
  | `user` | **Required** - Username |

* Edit message

  ```http
  DELETE /messages/{messageId}
  ```

  #### Request body:

  ```json
  {
    "to": "string",
    "text": "string",
    "type": "string"
  } 
  ```

  `type: "message" | "private_message"`

  #### Path parameters:

  | Parameter   | description                            |
  | :---------- | :------------------------------------- |
  | `messageId` | **Required** - ID of message to delete |

  #### Headers:

  | Name   | Description             |
  | :----- | :---------------------- |
  | `user` | **Required** - username |

### Status

* Renew status "online" of participant

  ```http
  POST /status
  ```

  #### Headers:

  | Name   | Description             |
  | :----- | :---------------------- |
  | `user` | **Required** - username |

## Run Locally

Clone the project:

```bash
  git clone https://github.com/lemoscaio/batepapo-uol-api.git
```

Go to the project directory:

```bash
  cd batepapo-uol-api
```

Install dependencies:

```bash
  npm install
```
Set up the environment variables in the `.env` file, using the `.env.example`.

Make sure the MongoDB server is running and available.

Start the server:

```bash
  node server.js
```

## Lessons Learned

In this project I learned:
* to build a simple API using NodeJS, Express and MongoDB
* to store basic data using a NoSQL database
* to manipulate time using the library `dayjs`
* to validate data with `Joi` schemas
* to sanitize data

## Acknowledgements

-   [Awesome Badges](https://github.com/Envoy-VC/awesome-badges)

