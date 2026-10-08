"use client";
import LoginScreen from "@/components/LoginScreen";

export default function LoginPage() {
  return (
    <LoginScreen
      onConnect={async (role) => {
        console.log("rol elegido:", role);
      }}
    />
  );
}