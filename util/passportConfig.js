import { Strategy as localStrategy} from "passport-local";
import { Strategy as jwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import "dotenv/config"


function passportConfig(passport){
    passport.use(new localStrategy(async (username, password, done) => {
        try {
            const user = await prisma.user.findUnique({
                where : {username : username}
            })
            if(!user){
                return done(null, false, {message : "Incorrect username"})
            }
            const match = await bcrypt.compare(password, user.password);
            if(!match){
                return done(null, false, {message : "Incorrect password"});
            }
            return done(null, user);
        }
        catch(err){
            return done(err);
        }
    }))
    passport.use(new jwtStrategy({
        secretOrKey : process.env.JWT_SECRET,
        jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken()
    }, async (jwt_payload, done) => {
        try {
            const user = await prisma.user.findUnique({
                where : {id : jwt_payload.id}
            })
        if(!user){
            done(null, false);
        }
        else {
            done(null, user);
        }
        }
        catch(err){
            done(err);
        }
    }))
}

export default passportConfig;