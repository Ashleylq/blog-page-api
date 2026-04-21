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
            const accessToken = jwt.sign({
                id : user.id,
            }, process.env.JWT_SECRET,{
                expiresIn : 60 * 30
            })
            const refreshToken = jwt.sign({
                id : user.id
            }, process.env.JWT_SECRET, {
                expiresIn : 60 * 60 * 24 * 7
            })
            await prisma.refreshToken.create({
                data : {
                    expiresAt : new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
                    token : refreshToken,
                    userid : user.id
                }
            })
            res.cookie("refreshToken", refreshToken, {
                maxAge : 1000 * 60 * 60 * 24 * 7,
                secure : false,
                httpOnly : true,
                sameSite : "none"
            })
            return res.json({
                accessToken : accessToken,
                user : user
            });
        }
    ]
)

authRouter.post('/login', (req, res) => {
    passport.authenticate('local', {session : false}, async (err, user, info) => {
        if(err){
            console.log(err)
            return res.status(500).send(err);
        }
        else if(!user){
            return res.status(401).json(info);
        }
        const accessToken = jwt.sign({
            id : user.id
        }, process.env.JWT_SECRET, {
            expiresIn : 60 * 30
        });
        const refreshToken = jwt.sign({
            id : user.id
        }, process.env.JWT_SECRET, {
            expiresIn : 60 * 60 * 24 * 7
        })
        await prisma.refreshToken.create({
            data : {
                userid : user.id,
                expiresAt : new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)),
                token : refreshToken
            }
        })
        res.cookie("refreshToken", refreshToken, {
            maxAge : 1000 * 60 * 60 * 24 * 7,
            secure : false,
            httpOnly : true,
            sameSite : "none"
        })
        return res.json({
            accessToken : accessToken,
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

authRouter.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const dbToken = await prisma.refreshToken.findUniqueOrThrow({
        where : {token : refreshToken}
    })
    const accessToken = jwt.sign({
        id : dbToken.userid
    }, process.env.JWT_SECRET, {
        expiresIn : 60 * 30
    })
    const newRefreshToken = jwt.sign({
        id : dbToken.userid
    }, process.env.JWT_SECRET, {
        expiresIn : 60 * 60 * 24 * 7
    })
    await prisma.refreshToken.update({
        data : {
            token : newRefreshToken,
            expiresAt : new Date(Date.now() + (1000 * 60 * 60 * 24 * 7))
        },
        where : {token : refreshToken}
    })
    res.cookie("refreshToken", newRefreshToken, {
        secure : false,
        httpOnly : true,
        maxAge : 1000 * 60 * 60 * 24 * 7,
        sameSite: "none"
    })
    res.json({token : accessToken})
})

authRouter.post('/logout', passport.authenticate('jwt', {session : false}), async (req, res) => {
    await prisma.refreshToken.delete({
        where : {userid : req.user.id}
    })
    res.clearCookie("refreshToken", {
        secure : false,
        httpOnly : true,
        samesite : "none"
    })
})

export default authRouter;