'use client'
import { useEffect, useState } from "react";
import { fetchProducts } from "./services/productService";
import { Product } from "./types/Product";
import styles from "@/app/styles/page.module.css"
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { IoAddCircleOutline } from "react-icons/io5";
import CreateLoopModal from "./components/createProduct";
import Spinner from "./components/Spinner";
import { useError } from "./context/ErrorContext";
import WelcomeModal from "./components/WelcomeModal";




export default function Home() {

  return (
    <>
     <h2>bienvenido</h2>
    </>
  );
}

