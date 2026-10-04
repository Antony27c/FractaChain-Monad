"use client";

import { createContext, useContext } from "react";

type DevAccountContextValue = { index: number; setIndex: (index: number) => void };

export const DevAccountContext = createContext<DevAccountContextValue>({
  index: 0,
  setIndex: () => {},
});

export const useDevAccount = () => useContext(DevAccountContext);
