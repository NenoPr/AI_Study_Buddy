// context/SummaryContext.jsx
import { createContext, useContext, useState } from "react";

const QuizContext = createContext();

export function QuizProvider({ children }) {
  const [quizActive, setQuizActive] = useState(false);
  const [quizJSON, setQuizJSON] = useState(null);

  return (
    <QuizContext.Provider
      value={{ quizActive, setQuizActive, quizJSON, setQuizJSON }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuizContext() {
  return useContext(QuizContext);
}
