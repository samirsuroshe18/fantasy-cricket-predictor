import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";

app.listen(process.env.PORT, ()=>{
    console.log(`Server is running on PORT : http://localhost:${process.env.PORT}`);
});