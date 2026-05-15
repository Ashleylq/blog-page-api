import { Router } from "express";
import prisma from "../lib/prisma.js";
import passport from "passport";
import commentsRoute from "./commentsRoute.js"

const postRouter = Router();

postRouter.get("/", async (req, res) => {
    const posts = await prisma.post.findMany();
    res.json({posts : posts});
})

postRouter.get("/:id", passport.authenticate('jwt', {session : false}) ,async (req, res) => {
    try{
        const post = await prisma.post.findUniqueOrThrow({
            where : {id : parseInt(req.params.id)},
            include : { comments : {
                include : {
                    user : true
                }
            },
            user : true}
        })
        res.json({post : post})
    }
    catch(err){
        res.status(404).json({err : err});
    }
})

postRouter.post('/', passport.authenticate('jwt', {session : false}),
    (req, res, next) => {
        if(req.user.role == "CREATOR"){
            next();
        }
        else {
            res.status(403).json({err : "Not authorized"})
        }
    },
    async (req, res) => {
        const {title, text} = req.body;
        await prisma.post.create({
            data : {
                title : title,
                text : text,
                userid : req.user.id
            }
        })
        res.json({success : true});
    }
)

postRouter.put('/:id', passport.authenticate('jwt', {session : false}),
    async (req, res, next) => {
        try{
            const post = await prisma.post.findUniqueOrThrow({
                where : {id : parseInt(req.params.id)}
            })
            if(req.user.id == post.userid){
                next();
            }
            else {
                res.status(403).json({err : "Not authorized"});
            }
        }
        catch(err){
            res.status(404).json({err : "Not found"})
        }
    },
    async (req, res) => {
        const {title, text} = req.body;
        await prisma.post.update({
            data : {
                title : title,
                text : text
            },
            where : {
                id : parseInt(req.params.id)
            }
        })
        res.json({success : true});
    }
)

postRouter.delete('/:id', passport.authenticate('jwt', {session : false}),
    async (req, res, next) => {
        try{
            const post = await prisma.post.findUniqueOrThrow({
                where : {id : parseInt(req.params.id)}
            })
            if(req.user.id == post.userid){
                next();
            }
            else {
                res.status(403).json({err : "Not authorized"});
            }
        }
        catch(err){
            res.status(404).json({err : "Not found"})
        }
    },
    async (req, res) => {
        await prisma.post.delete({
            where : {id : parseInt(req.params.id)}
        })
        res.json({success : true});
    }
)

postRouter.use('/:postid/comments', async (req, res, next) => {
    const post = await prisma.post.findUnique({
        where : {id : parseInt(req.params.postid)}
    })
    if(!post){
        res.status(404).json({err : "Not found"})
    }
    else {
        next();
    }
}, commentsRoute);

export default postRouter;