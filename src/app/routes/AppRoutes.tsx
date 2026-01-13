import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../pages/home/HomePage";
import { CadastroPage } from "../pages/cadastro/CadastroPage";
import { LivenessPage } from "../pages/Liveness/LivenessPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/liveness" element={<LivenessPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
