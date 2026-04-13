import './App.css'
import { RouterProvider } from "react-router-dom";
import { RouterApp } from "./routes/AppRouter";

function App() {

  return (
    <>
        <RouterProvider router={RouterApp} />
    </>
  )
}

export default App
