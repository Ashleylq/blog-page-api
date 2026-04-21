import { Router } from "express";
import prisma from "../lib/prisma.js";
import passport from "passport";
import commentsRoute from "./commentsRoute.js"

const postRouter = Router();

postRouter.get("/", async (req, res) => {
    const posts = await prisma.post.findMany();
    res.json(posts);
})

postRouter.get("/:id", passport.authenticate('jwt', {session : false}) ,async (req, res) => {
    const post = await prisma.post.findUniqueOrThrow({
        where : {id : parseInt(req.params.id)},
        include : {comments : true}
    })
    res.json(post)
})

postRouter.post('/', passport.authenticate('jwt', {session : false}),
    (req, res, next) => {
        if(req.user.role == "CREATOR"){
            next();
        }
        else {
            res.status(403).send("Not authorized")
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
        res.send("Successfully created post")
    }
)

postRouter.put('/:id', passport.authenticate('jwt', {session : false}),
    async (req, res, next) => {
        const post = await prisma.post.findUniqueOrThrow({
            where : {id : parseInt(req.params.id)}
        })
        if(req.user.id == post.id){
            next();
        }
        else {
            res.status(403).send("Not authorized");
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
        res.send("Successfully edited post");
    }
)

postRouter.delete('/:id', passport.authenticate('jwt', {session : false}),
    async (req, res, next) => {
        const post = await prisma.post.findUniqueOrThrow({
            where : {id : parseInt(req.params.id)}
        })
        if(req.user.id = post.id){
            next();
        }
        else {
            res.status(403).send("Not authorized");
        }
    },
    async (req, res) => {
        await prisma.post.delete({
            where : {id : parseInt(req.params.id)}
        })
        res.send("Successfully deleted post");
    }
)

postRouter.use('/:postid/comments', commentsRoute);

export default postRouter;