// Import everything from express and assign it to the express variable
import * as express from 'express';
import * as bodyParser from 'body-parser';

import { ImageUploadController } from './controllers'

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
const port: number = (process.env.PORT) ? Number(process.env.PORT) : 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
RegisterRoutes(app);

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