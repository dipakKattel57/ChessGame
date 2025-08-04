import {useEffect, useRef, useState} from "react";
import "./Game.scss";
import ChessBoard from "../../components/chessBoard/ChessBoard.jsx";
import newRequest from "../../utils/newRequest.js";
import getCurrentUser from "../../utils/getCurrentUser.js";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const Game = () => {
  const currentUser = getCurrentUser();
  const [online, setOnline] = useState(false)
  const { id } = useParams();

  
  const [matchData, setMatchData] = useState(null)

  const [socket, setSocket]= useState(null);


  useEffect(()=>{
    if(socket){
      return;
    }
    let abc = io(import.meta.env.VITE_DS_CHESSGAME_API)
    setSocket(abc)
  }, [])


  const { isLoading, error, data } = useQuery({
    queryKey: ["match"],
    queryFn: () =>
      newRequest.get(`/match/${id}`).then((res) => {
        console.log(res.data);
        console.log("Inside Request")
        setTurn(res.data?.turn);
        setMatchData(res.data);
        return res.data;
      }),
  });

  const [pTurn, setTurn] = useState(data?.turn)


  const [myTimer, setMyTimer] = useState();
  const [opponentTimer, setOpponentTimer] = useState();

  useEffect(()=>{
    if(!socket){
      return
    }
    const timeHandler = (time)=>{
      console.log("Timer Received: ", time)
      if(currentUser._id == pTurn){
        setMyTimer(time)
        setOpponentTimer(null)
      }else if(currentUser._id != pTurn){
        setOpponentTimer(time)
        setMyTimer(null)
      }
    };
    socket.on("timer", timeHandler);

    return ()=>{
      socket.off("timer", timeHandler)
    }
  },[socket, pTurn])

  useEffect(()=>{
    console.log("MyTimer: ", myTimer);
    console.log("Opponent Timer: ", opponentTimer);
  },[opponentTimer, myTimer])

  useEffect(()=>{
    console.log(pTurn);
  },[pTurn])

  useEffect(()=>{

    if(myTimer !== 0 && opponentTimer !== 0){
      return
    }
    console.log("Match Data: ", matchData)
    let winner = (opponentTimer === 0) ? currentUser._id : (matchData.black == currentUser._id) ? matchData.white : matchData.black;

    console.log("Winner: ", winner)

    socket.emit("move", {id: matchData._id, winner});
  },[myTimer, opponentTimer])


  if (isLoading || error) {
    return (
      <div className="Game">
        <div className="processing">loading...</div>
      </div>
    );
  }

  return (
    <div className="Game">
     {isLoading ? (
        <span className="processing">loading...</span>
      ) : error ? (
        <span className="processing">Something went wrong :( Try Reloading.</span>
      ) :
      <div className="container">
        <div className="left">
          <div className="opponent">
            <div className="userInfo">
            <img src={data.opponentImg || "/img/profile.png"} alt="" />
            <span>{data.opponentName || "Opponent"}</span>
            </div>
           <div className="additionalInfo">
           <span className="online">{online ? "Online" : "Offline"}</span>
           <div className="timer">{opponentTimer}</div>
           {pTurn != null && pTurn == currentUser?._id ? "" :  <button>Turn</button>}</div> 
          </div>
        </div>
        <div className="right">
          <ChessBoard
            id={data._id}
            code={data.code}
            boardState={data.boardState}
            whiteP={data.white}
            blackP={data.black}
            turnP={data.turn}
            moves={data.moves}
            cKing={data.checkedKing}
            w = {data.winner}
            lM = {data.lastMove}
            cS = {data.castling}
            status = {data.status}
            online={setOnline}
            pTurn = {setTurn}
            socket={socket}
          />
        </div>
        <div className="me">
          <div className="userInfo">
          <img src={currentUser?.img || "/img/profile.png"} alt="" />
          <span>{currentUser?.fullName || "Me"}</span>
          </div>
          <div className="additionalInfo">
          <span className="player">{data.white === currentUser?._id ? "White" : "Black"}</span>
          <div className="timer">{myTimer}</div>
          {pTurn != null && pTurn == currentUser?._id ? <button>Turn</button> : ""}
          </div>
        </div>
      </div>
      }
    </div>
  );

};

export default Game;
