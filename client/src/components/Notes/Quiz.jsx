import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Select from "react-select";

export default function Quiz({ quizJSON, setQuizActive }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [groups, setGroups] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteAdd, setNoteAdd] = useState(false);
  const [selectIsDisabled, setSelectIsDisabled] = useState(false);
  const [selectIsLoading, setSelectIsLoading] = useState(false);
  const { token } = useAuth();

  console.log("quizJSON:", quizJSON);
  return (
    <div className="quiz-open">
      {quizJSON.questions.map((question, index) => {
        return (
          <>
            <div key={index}>{question.question}</div>
            <select name="" id="">
                {Object.entries(question.options).map(([key, value]) => {
                    return <option>{key}: {value}</option>
                })}
            </select>
          </>
        );
      })}
      <div>{quizJSON.questions[0].question}</div>
      <button onClick={() => setQuizActive(false)}>Return</button>
    </div>
  );
}
