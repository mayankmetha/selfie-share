# to start server
`npm install` //First time only <br>
`npm run build` <br>
`npm start` <br>

# to test rest api

`curl -X [GEP|POST|PUT|DELETE] localhost:3000/[rest of the path]`
<br>
OR
<br>
Start the server<br>
Navigate to 'http://localhost:3000/'<br>
Use the Swagger UI to run any of the REST APIs<br>
<br>
Adding new controllers:<br>
A sample implementation is in the "UserController" controller.<br>
<br>
Testing:
<br>
Uses mocha and chai for tests. Put all test files under the 'test' folder. Example test/users.test.ts. <br>
Running Tests <br>
Start the server using `npm start`<br>
In a different window, run `npm run test`

References used:<br>
https://dev.to/briandgls/using-typescript-with-express--e0k
https://www.rajram.net/node-101-part-4-auto-generate-and-register-routes-in-node-for-web-apis-2/
https://www.rajram.net/node-101-part-5-auto-generate-swagger-for-your-web-api-and-use-swaggerui-to-try-it-out/
