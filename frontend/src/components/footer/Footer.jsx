import React from "react"
import "./Footer.scss"
import {Link} from "react-router-dom"

const Footer  = () =>{
    return (
        <div className="Footer">
          <hr/>
        <div className="container">
        <div className="logo">
          <span className="chess">DS-Chess</span>
          <span className="buddy">Game</span>
        </div>
        <div className="section">
        <Link to="https://github.com/tanu-chahal/CHESS-Buddy" className="link" target="_blank">{"Code </>"}</Link>
        <span></span></div>
        </div>
        </div>
    )
}
export default Footer;