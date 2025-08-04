import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import matchRoute from "./routes/match.route.js";
import { updateMatch } from "./controllers/match.controller.js";

const app = express();
const httpServer = createServer(app);
const allowedOrigins = ["https://chess-game-two-self.vercel.app","http://localhost:5173","http://127.0.0.1:5173"];
app.set("trust proxy", true);
app.use(cors({ origin: allowedOrigins, credentials: true }));
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT"],
    credentials: true,
  },
});
dotenv.config();
mongoose.set("strictQuery", true);

app.use(express.json());
app.use(cookieParser());

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");
  } catch (error) {
    console.log(error);
  }
};

app.get("/", (req, res) => {
  res.send("Hello, DS-ChessGame API Server is running!");
});

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/match", matchRoute);

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).send(errorMessage);
});

const onlinePlayers = new Map();

const matchTimerMap = new Map();

io.on("connection", (socket) => {

  

  socket.on("joinMatch", (code) => {
    console.log("Connected in room!");
    if (!onlinePlayers.has(code)) {
      onlinePlayers.set(code, new Set());
    }
    onlinePlayers.get(code).add(socket.id);
    
    // socket.on("gameOver", ()=>{
    //   let matchTimer = matchTimerMap.get(code);
    //   clearInterval(matchTimer?.timerId);
    //   matchTimerMap.delete(code)
    // });

    socket.on("turnChange", ()=>{
      console.log("Turn Change Received")
      let matchTimer = matchTimerMap.get(code);
       matchTimerMap.set(code, {...matchTimer, time: 30})
  });

    socket.join(code);
    const numberOfPlayers = onlinePlayers.get(code).size;
   if(numberOfPlayers===2){
    console.log("Two players")
    io.to(code).emit("OpponentStatus", true)
    if(!matchTimerMap.has(code)){
      let timerId = setInterval(()=>{
      let matchTimer = matchTimerMap.get(code);
      io.to(code).emit("timer", matchTimer.time)
      console.log("Timer emitted..")
      let time = matchTimer.time - 1 >= 0 ? matchTimer.time - 1 : 0;
      matchTimerMap.set(code, {...matchTimer, time})
      },1000)
      matchTimerMap.set(code, {timerId, time:30});
    
    }
    
    
  }else{
socket.to(code).emit("OpponentStatus", false);
console.log("No two players")
  }

    socket.on("disconnect", () => {
      onlinePlayers.get(code).delete(socket.id);
      io.to(code).emit("OpponentStatus", false);
    });
  });

  socket.on("move", async (data) => {
    const updatedData = await updateMatch(data);
    if(updatedData.winner){
      let matchTimer = matchTimerMap.get(updatedData.code);
      clearInterval(matchTimer?.timerId);
      matchTimerMap.delete(updatedData.code)
    }
    io.to(updatedData.code).emit("updated", updatedData);
  });
});

const PORT = process.env.PORT || 4000;

(async function(){
  await connect()
  httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});

})();