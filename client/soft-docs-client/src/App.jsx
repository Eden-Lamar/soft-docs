// import { useState } from 'react'
import TextEditor from "./components/TextEditor";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom"
import {v4 as uuidV4} from 'uuid'
import './App.css'

function App() {
  return( 
    <Router>
      <Switch>
        <Route path="/" exact>
          <Redirect to={`/documents/${uuidV4()  }`} />
        </Route>
        <Route path="/documents/:id" >
          <TextEditor />
        </Route>
      </Switch>
    </Router>
  )
}

export default App
