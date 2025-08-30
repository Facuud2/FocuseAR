import { AuthProvider, useAuth } from "./AuthContext";
import LoginForm from "./LoginForm";
import Dashboard from "./Dashboard";
import './App.css';

function Main() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <LoginForm />;
}

function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}

export default App;
