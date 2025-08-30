import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import "./App.css";

const App: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? <Dashboard /> : <Login onLogin={() => setLoggedIn(true)} />;
};

export default App;
