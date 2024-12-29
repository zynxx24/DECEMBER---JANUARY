import { useState } from "react";
import Login from "./(auth)/login/page";
import Register from "./(auth)/register/page";

const Home = () => {
  const [showLogin, setShowLogin] = useState(true);

  const handleToggle = () => {
    setShowLogin((prev) => !prev);
  };

  return (
    <div className="bg-blue-900 h-screen flex items-center justify-center">
      <div >
        {showLogin ? <Login /> : <Register />}
        <div className="flex items-center ">
        <button
          onClick={handleToggle}
          className="mt-3 m w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
        >
          {showLogin ? "No account? Register now!" : "Have an account? Login!"}
        </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
