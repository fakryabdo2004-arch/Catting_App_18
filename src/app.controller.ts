//ENV
import {resolve} from 'node:path'
import { config } from 'dotenv'
config({path:resolve("./config/.env.development")})
//EXPRESS
import  type  { Express, Request, Response } from 'express'
import express  from 'express'
//LOG
import {log } from 'node:console'
//THIRD MIDDLEWARE
import cors from 'cors'
import helmet from 'helmet'
import {rateLimit} from 'express-rate-limit'

//MODULE ROUTING
import assetsController from "./modules/assets/assets.controller"
import authController from "./modules/auth/auth.controller"
import userController from "./modules/user/user.controller"
import { globalErrorHandeling } from './utils/response/error.response'
import connectDB from './DB/connections.db'


 const limiter = rateLimit({
    windowMs:60 * 60000,
    limit:2000,
    message:{error:"Too many request please try again"},
    statusCode : 429
   })

const bootstrap = async (): Promise<void> =>{
  const app : Express = express()
  const port : number| String = process.env.PORT || 5000;
   
    app.use(cors() ,express.json() , helmet() , limiter)
   
    //app routing
   app.get("/" ,(req:Request,res:Response) => {
        res.json({message : `welcome to ${process.env.APPLICATION_NAME} backend landeng page` })
    })
   
    //modules
   
   app.use("/auth", authController)
   app.use("/user", userController)
   app.use("/assets", assetsController);
   app.use("{/*dummy}",(req:Request, res:Response)=>{
    return res.status(404).json({message : "In-valid application routing please check the method and url"})
    })

   app.use(globalErrorHandeling)

   await connectDB()
   
   app.listen(port, () =>{
        log(`server is running on port ::: ${port}`)

    } )
}
export default bootstrap
// Post routes
app.use('/post', (await import('./modules/post/post.controller.ts')).default)
