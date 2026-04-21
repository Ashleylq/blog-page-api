import { Router } from "express";
import passport from "passport";
import prisma from "../lib/prisma.js";
import { ResultWithContextImpl } from "express-validator/lib/chain/context-runner-impl.js";

const commentsRouter = Router({mergeParams : true});

commentsRouter.post('/', passport.authenticate('jwt', {session : false}), async (req, res) => {
    await prisma.comment.create({
        data : {
            text : req.body.text,
            userid : req.user.id,
            postid : parseInt(req.params.postid)
        }
    })
    res.send("Successfully created comment");
})

commentsRouter.put('/:commentid', passport.authenticate('jwt', {session : false}),
    async (req, res, next) => {
        const comment = await prisma.comment.findUniqueOrThrow({
            where : {id : parseInt(req.params.commentid)}
        })
        if(req.user.id == comment.userid){
            next();
        }
        else {
            res.status(403).send("Not authorized");
        }
    },
    async (req, res) => {
        await prisma.comment.update({
            data : {
                text : req.body.text
            },
            where : {
                id : parseInt(req.params.commentid)
            }
        })
        res.send("Successfully edited comment")
    }
)

commentsRouter.delete('/:commentid', passport.authenticate('jwt', {session : false}),
    async (req, res, next) => {
        const comment = await prisma.comment.findUniqueOrThrow({
            where : {id : parseInt(req.params.commentid)}
        })
        if(comment.userid == req.user.id){
            next();
        }
        else {
            res.status(403).send("Not authorized");
        }
    },
    async (req, res) => {
        await prisma.comment.delete({
            where : {id : parseInt(req.params.commentid)}
        })
        res.send("Successfully deleted comment");
    }
)

export default commentsRouter;