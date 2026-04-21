import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { body, matchedData, validationResult } from "express-validator";
import passport from "passport";
import jwt from "jsonwebtoken";
import "dotenv/config";

const authRouter = Router();

authRouter.post('/signup', 
    [
        body("email").trim()
        .isEmail().withMessage("Invalid email address")
        .custom(async value => {
            const user = await prisma.user.findUnique({
                where : {email : value}
            })
            if(user){
                throw new Error("Email already exists");
            }
            return true;
        }),
        body("username").trim()
        .custom(async value => {
            const user = await prisma.user.findUnique({
                where : {username : value}
            })
            if(user){
                throw new Error("Username already exists");
            }
            return true;
        }),
        body("password").trim(),
        body("confirmPassword").trim()
        .custom(async (value, {req}) => {
            if(value !== req.body.password){
                throw new Error("Passwords should match");
            }
            return true;
        }),
        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json(errors)
            }
            const {email, username, password, role} = matchedData(req);
            const hashedPass = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data : {
                    email : email,
                    username : username,
                    password : hashedPass,
                    role : role
                }
            })
            const token = jwt.sign({
                id : user.id
            }, process.env.JWT_SECRET)
            return res.json({
                token : token,
                user : user
            });
        }
    ]
)

authRouter.post('/login', (req, res) => {
    passport.authenticate('local', {session : false}, (err, user, info) => {
        if(err){
            console.log(err)
            return res.status(500).send(err);
        }
        else if(!user){
            return res.status(401).json(info);
        }
        const token = jwt.sign({
            id : user.id
        }, process.env.JWT_SECRET);
        return res.json({
            token : token,
            user : user
        });
    })(req, res)
})

authRouter.patch('/role', passport.authenticate('jwt', {session : false}), async (req, res) => {
    if(req.body.passcode == process.env.CREATOR_PASSCODE){
        const user = await prisma.user.update({
            data : {role : "CREATOR"},
            where : {id : req.user.id}
        })
        res.json(user);
    }
    else {
        res.status(401).json({msg : "Incorrect passcode"})
    }
})

export default authRouter;