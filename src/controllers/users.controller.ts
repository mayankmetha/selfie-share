
// Import only what we need from express
import { Router, Request, Response } from 'express';

// Assign router to the express.Router() instance
const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
    console.log("Get all users");
    
});

export const UserController: Router = router;