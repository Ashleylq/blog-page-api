import express from "express";
import passportConfig from "./util/passportConfig.js";
import passport from "passport";
import authRoute from "./routes/authRoute.js";
import postsRoute from "./routes/postsRoute.js"

const app = express();

app.use(passport.initialize());
passportConfig(passport);
app.use(express.json());

app.use("/auth", authRoute);
app.use("/posts", postsRoute);

app.listen(3000, (err) => {
    if(err){ throw(err) }
    console.log("Listening")
})