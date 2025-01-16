import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./utils/errorHandler.js";

const app = express();

app.use(cors({origin: process.env.ORIGIN, credentials: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

//routes import
import langflowRouter from "./routes/langflow.route.js";

//routes declaration
app.use("/api/v1/langflow", langflowRouter); 

app.use(errorHandler);

export default app;
