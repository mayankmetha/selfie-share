// Import everything from express and assign it to the express variable
import * as express from 'express';
import * as bodyParser from 'body-parser';

// Import WelcomeController from controllers entry point
import { WelcomeController, UserController } from './controllers';
import { RegisterRoutes } from './routes/routes';
import * as swaggerUI from 'swagger-ui-express';

const swaggerJSON = require('../src/swagger/swagger.json');

// Create a new express application instance
const app: express.Application = express.default();
// The port the express app will listen on
const port: number = (process.env.PORT) ? Number(process.env.PORT) : 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Mount the WelcomeController at the /welcome route

app.use('/welcome', WelcomeController);
//app.use(methodOverride());
RegisterRoutes(app);

app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerJSON));

// Serve the application at the given port
app.listen(port, () => {
    // Success callback
    console.log(`Listening at http://localhost:${port}/`);
});
