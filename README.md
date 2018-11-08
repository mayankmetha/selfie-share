# to start server
`npm install` # First time only
`npm run build`
`npm start`

# to test rest api

`curl -X [GEP|POST|PUT|DELETE] localhost:8080/[rest of the path]`
OR
Start the server
Navigate to 'http://localhost:3000/'
Use the Swagger UI to run any of the REST APIs

Adding new controllers:
A sample implementation is in the "UserController" controller.

References used:
https://dev.to/briandgls/using-typescript-with-express--e0k
https://www.rajram.net/node-101-part-4-auto-generate-and-register-routes-in-node-for-web-apis-2/
https://www.rajram.net/node-101-part-5-auto-generate-swagger-for-your-web-api-and-use-swaggerui-to-try-it-out/