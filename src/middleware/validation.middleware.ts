import { NextFunction ,Request ,Response} from "express"
import { ZodError,ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";
import {z} from 'zod'

type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType,ZodType>>
type ValidationErrorsType = Array<{
   key:KeyReqType;
   issues:Array<{
    message:string,
    path : string | number | undefined  
     }>
     }>[]
export const validation = (schema: SchemaType) => {
    return (req:Request, res:Response , next: NextFunction) : NextFunction => {
     console.log(schema);
     console.log(Object.keys(schema));
     
    
     const validationError : ValidationErrorsType = [];
     for (const key of Object.keys(schema) as KeyReqType[]){
        if(!schema[key])continue;

     const validationResult = schema[key].safeParse(req[key])
     
     if(!validationResult.success){
       
        const errors = validationResult.error as ZodError
         validationError.push({key ,
            issues : errors.issues.map((issues) => {
                return { message: issues.message,path:issues.path[0]};

            })
        })
     }

    } 
        if(validationError.length){
            throw new BadRequestException("validation Error",{
                validationError
            })
    }


        return next() as unknown as NextFunction
    }
}


export const generalFields = {

    username: z.string().min(2).max(20),
            email: z.string().email(),
            otp:z.string().regex(/^\d{6}$/),
            password:z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
            confirmPassword: z.string(),
}