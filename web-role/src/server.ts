// Import everything from express and assign it to the express variable
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { readFile } from 'fs'
import { UserController, ImageController, FriendsController } from './controllers'

// Import WelcomeController from controllers entry point
// import { WelcomeController } from './controllers';
import { RegisterRoutes } from './routes/routes';
import * as swaggerUI from 'swagger-ui-express';
import { NextFunction } from 'connect';
import { CustomError } from './model';

const swaggerJSON = require('./swagger/swagger.json');

// Create a new express application instance
const app: express.Application = express.default();
// The port the express app will listen on
const port: number = (process.env.PORT) ? Number(process.env.PORT) : 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount the WelcomeController at the /welcome route

//app.use('/welcome', WelcomeController);
//app.use(methodOverride());
RegisterRoutes(app);
app.use('/jquery.min.js', function(req, res) {
    readFile(__dirname + '/../frontend/jquery.min.js', 'utf8', function(err, text){
                res.send(text);
            });
});

app.use('/ui', function(req, res) {
    readFile(__dirname + '/../frontend/login.html', 'utf8', function(err, text){
                res.send(text);
            });
});

app.use('/landing', function(req, res) {
    readFile(__dirname + '/../frontend/landingPage.html', 'utf8', function(err, text){
                res.send(text);
            });
});
app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerJSON));

// Serve the application at the given port
app.listen(port, () => {
    // Success callback
    console.log(`Listening at http://localhost:${port}/`);
});

app.use(function (err: CustomError, req: express.Request, res: express.Response, next: NextFunction) {
    console.error(err.stack)
    res.status(err.statusCode).send(
        { error: err.message }
    );
});