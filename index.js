import express from "express";
import passportConfig from "./util/passportConfig.js";
import passport from "passport";
import authRoute from "./routes/authRoute.js";
import postsRoute from "./routes/postsRoute.js";
import cors from "cors"
import "dotenv/config"

const app = express();

app.use(cors({
    origin : ["https://blog-creator-page.onrender.com", "https://blog-page-i6lm.onrender.com"]
}));
app.use(passport.initialize());
passportConfig(passport);
app.use(express.json());

app.use("/auth", authRoute);
app.use("/posts", postsRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if(err){ throw(err) }
    console.log("Listening")
})