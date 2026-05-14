import { Router } from "express";
import passport from "passport";
import prisma from "../lib/prisma.js";

const commentsRouter = Router({mergeParams : true});

commentsRouter.post('/', passport.authenticate('jwt', {session : false}), async (req, res) => {
    const comment = await prisma.comment.create({
        data : {
            text : req.body.text,
            userid : req.user.id,
            postid : parseInt(req.params.postid)
        },
        include : {
            user : true
        }
    })
    res.json({comment : comment});
})

commentsRouter.put('/:commentid', passport.authenticate('jwt', {session : false}),
    async (req, res, next) => {
        try{
            const comment = await prisma.comment.findUniqueOrThrow({
                where : {id : parseInt(req.params.commentid)}
            })
            if(req.user.id == comment.userid){
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
        await prisma.comment.update({
            data : {
                text : req.body.text
            },
            where : {
                id : parseInt(req.params.commentid)
            }
        })
        res.json({success : true})
    }
)

commentsRouter.delete('/:commentid', passport.authenticate('jwt', {session : false}),
    async (req, res, next) => {
        try{
            const comment = await prisma.comment.findUniqueOrThrow({
                where : {id : parseInt(req.params.commentid)}
            })
            if(comment.userid == req.user.id){
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
        await prisma.comment.delete({
            where : {id : parseInt(req.params.commentid)}
        })
        res.json({success : true});
    }
)

export default commentsRouter;