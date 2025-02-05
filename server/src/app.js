import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./utils/errorHandler.js";

const app = express();

app.use(cors({origin: process.env.ORIGIN, credentials: true}));
//localhost: 8000 react on localhost:5173 both have different origin 
//reach sends req to 8000 in abscnece of milldle ware this cross origin will throw error
//in presence from any soucrce orgin reaquest can be handled.  ORIGIN is * i.e any request
//credentials true is can read http cookies.
app.use(express.json());       //converting json string body into js object
app.use(express.urlencoded({extended: true}));  //resolves the nested object when given extended
app.use(cookieParser());
//request in js is always a object.

//routes import
import langflowRouter from "./routes/langflow.route.js";

//routes declaration
app.use("/api/v1/langflow", langflowRouter); 

app.use(errorHandler);

export default app;
