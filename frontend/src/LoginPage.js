import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DarkVeil from './components/DarkVeil';
import ElectricBorder from './components/ElectricBorder';

function LoginPage() {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true); 

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include' 
      });
      const data = await response.json();
      
      if (response.ok) {
        navigate('/dashboard');
      } else {
        alert("Login Failed: " + data.message);
      }
    } catch (err) {
      alert("Server Error: " + err.message);
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('http://localhost:5000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();

        if (response.ok) {
            alert("Account Created! Please Sign In.");
            setIsLoginView(true); 
        } else {
            alert("Signup Failed: " + data.message);
        }
    } catch (err) {
        alert("Server Error: " + err.message);
    }
  }

  const handleOAuth = () => {
    window.location.href = 'http://localhost:5000/login/google';
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden text-zinc-100 font-sans antialiased">
      <DarkVeil 
        className="fixed inset-0 w-full h-full -z-10"
        speed={0.5} noiseIntensity={0.05} scanlineIntensity={0.05} warpAmount={0.2}
      />
      
      <div className="p-1 rounded-xl animated-gradient bg-gradient-to-r from-purple-500 via-indigo-500 via-red-500 via-yellow-400 to-purple-500">
        <div className={`w-full max-w-md space-y-6 bg-zinc-800 px-12 rounded-lg ${isLoginView ? 'py-10' : 'py-6'}`}>
          <div>
            <h2 className="mt-1 text-center text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-indigo-500 via-red-500 via-yellow-400 to-purple-500 animated-gradient">
                {'"Kuizottar"'}
            </h2>
            <h2 className="mt-1 text-center text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-indigo-500 via-red-500 via-yellow-400 to-purple-500 animated-gradient">
                {isLoginView ? 'Quiz App Login' : 'Create Account'}
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
                {isLoginView ? 'Welcome back! Please sign in.' : 'Join us to start creating quizzes.'}
            </p>
          </div>
          
          <form className={isLoginView ? "space-y-6" : "space-y-4"} onSubmit={isLoginView ? handleLogin : handleSignup}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-300">Username</label>
              <div className="mt-1">
                <input 
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  id="username" type="text" required
                  className={`max-w-md w-full px-5 bg-zinc-700 border border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isLoginView ? 'py-2' : 'py-1.5'}`}
                />
              </div>
            </div>
            {!isLoginView && (
                <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">Email</label>
                <div className="mt-1">
                    <input 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    id="email" type="email" required
                    className={`max-w-md w-full px-5 bg-zinc-700 border border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isLoginView ? 'py-2' : 'py-1.5'}`}
                    />
                </div>
                </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">Password</label>
              <div className="mt-1">
                <input 
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  id="password" type="password" required
                  className={`max-w-md w-full px-5 bg-zinc-700 border border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isLoginView ? 'py-2' : 'py-1.5'}`}
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <ElectricBorder color="#6316a7" thickness={3} chaos={1.5} speed={2} className="rounded-full">
                <button 
                  type="submit"
                  className="relative z-20 w-40 px-6 py-3 text-sm font-semibold text-white bg-black rounded-full hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-purple-500 transition-all duration-300 cursor-pointer">
                  {isLoginView ? 'Sign in' : 'Sign up'}
                </button>
              </ElectricBorder>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-600"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-zinc-800 text-zinc-400">Or continue with</span></div>
          </div>
          
          <div className="relative z-50">
            <button 
                onClick={handleOAuth} type="button"
                className="w-full flex justify-center items-center py-2 px-4 border border-zinc-600 rounded-md shadow-sm bg-zinc-700 text-sm font-medium text-zinc-200 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-indigo-500 cursor-pointer">
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l0.001-0.001l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                {isLoginView ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
          </div>
          
          <div className="text-sm text-center relative z-50">
            <button 
                onClick={() => setIsLoginView(!isLoginView)} 
                className="font-medium text-indigo-400 hover:text-indigo-300 text-xs bg-transparent border-none cursor-pointer">
                {isLoginView ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;