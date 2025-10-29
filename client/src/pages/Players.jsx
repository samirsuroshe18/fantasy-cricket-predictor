import React from 'react'
import { Link } from 'react-router-dom'

function Players() {
  return (
    <div>
      <h1>Players</h1>
    <Link to="/prediction"><span>Predict winning 11</span></Link>
    </div>
  )
}

export default Players
