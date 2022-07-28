const http = require("http");

require("dotenv").config();

process.env.TZ = "UTC";
const app = require("./config/app");
const expressSwagger = require('express-swagger-generator')(app);

let options = {
    "swagger": "2.0",
    "swaggerDefinition":{
    "info": {
      "description": "This are APIs for finding user information",
      "version": "1.0.0",
      "title": "User Information"
    },
    "host": "snapshotapi.seedify.info",
    "basePath": "/api/v1",
    "tags": [
      {
        "name": "User",
        "description": "User Information apis"
      }
    ],
    "schemes": [
      "https"
    ],
    "paths": {
      "/user/tier-info/{address}": {
        "get": {
          "tags": [
            "User"
          ],
          "summary": "User tier info from wallet address",
          "description": "",
          "produces": [
            "application/json"
          ],
          "parameters": [
            {
              "name": "address",
              "in": "path",
              "description": "Wallet address goes here",
              "required": true,
              "type": "string"
            },
            {
              "name": "Origin",
              "type": "string",
              "in": "header",
              "default": "http://localhost:4000"
            }
          ],
          "responses": {
            "200": {
              "description": "successful fetch",
              "schema": {
                "$ref": "#/definitions/usertier"
              }
            },
            "404": {
              "description": "Failed to fetch user data",
              "schema": {
                "$ref": "#/definitions/usertiererr"
              }
            }
          }
        }
      }
    },
    "definitions": {
      "usertier": {
        "type": "object",
        "properties": {
          "status": {
            "type": "boolean"
          },
          "data": {
            "$ref": "#/definitions/data"
          }
        }
      },
      "data": {
        "type": "object",
        "properties": {
          "walletAddress": {
            "type": "string"
          },
          "tier": {
            "type": "string"
          }
        }
      },
      "usertiererr": {
        "type": "object",
        "properties": {
          "status": {
            "type": "boolean"
          },
          "data": {
            "type": "string"
          }
        }
      }
    }
  },
  basedir: __dirname, //app absolute path
  files: ['./routes/**/*.js'] //Path to the API handle folder
};

expressSwagger(options);

app.all('/*', (req, res) =>
  res.status(404).json({ status: false, message: 'Invalid Requests' })
);

http.createServer(app).listen(app.get("port"), () => {
  console.log(`Seedify server listening on port ${app.get("port")}`);
});
