import React from "react";
import Menubar from "./components/Menubar/Menubar";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Contact from "./pages/Contact/Contact";
import ExploreFood from "./pages/ExploreFood/ExploreFood";
import FoodDetails from "./pages/FoodDetails/FoodDetails";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import { ToastContainer } from "react-toastify";
import PaymentSuccess from "./components/PaymentSuccess/PaymentSuccess";
import PaymentFailure from "./components/PaymentFailure/PaymentFailure";
import MyOrders from "./pages/MyOrders/MyOrders";
import About from "./pages/About/About";
import Legal from "./pages/Legal/Legal";
import Footer from "./components/Footer/Footer";

const App = () => {
  return (
    <div>
      <Menubar />

      <ToastContainer autoClose={2000} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/explore" element={<ExploreFood />} />
        <Route path="/food/:id" element={<FoodDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order" element={<PlaceOrder />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment/success/:orderId" element={<PaymentSuccess />} />
        <Route path="/payment/fail/:orderId" element={<PaymentFailure />} />
        <Route path="/myorders" element={<MyOrders />} />
        <Route path="/about" element={<About />} />
        <Route path="/impressum" element={<Legal field="imprint" />} />
        <Route path="/datenschutz" element={<Legal field="privacyPolicy" />} />
        {/* alte Entwickler-Seite (Groß-/Kleinschreibung egal) -> Über uns */}
        <Route path="/moredetails" element={<Navigate to="/about" replace />} />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
