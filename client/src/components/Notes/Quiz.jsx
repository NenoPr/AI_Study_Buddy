import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Select from "react-select";

export default function Quiz({ quizJSON, setQuizActive }) {
  const [answers, setAnswers] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizGraded, setQuizGraded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [groups, setGroups] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteAdd, setNoteAdd] = useState(false);
  const [selectIsDisabled, setSelectIsDisabled] = useState(false);
  const [selectIsLoading, setSelectIsLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    console.log(answers);
  }, [answers]);

  function submitQuiz(e) {
    e.preventDefault();
    console.log(e.target);
    const formData = new FormData(e.target);
    let newAnswers = Object.fromEntries(
      Array.from(formData.entries()).map(([questionId, answer]) => [
        questionId,
        { answer, isCorrect: false },
      ])
    );
    console.log("Selected answers:", newAnswers);
    quizJSON.questions.map((question, key) => {
      console.log(question.correct_answer);
      console.log(newAnswers[`option-${key}`].answer);
      if (question.correct_answer == newAnswers[`option-${key}`].answer) {
        console.log(
          "Correct!",
          question.correct_answer,
          " == ",
          newAnswers[`option-${key}`].answer
        );
        newAnswers[`option-${key}`].isCorrect = true;
        setCorrectAnswers(correctAnswers + 1);
      }
    });
    console.log("Selected answers after check: ", newAnswers);
    setAnswers(newAnswers);
    setQuizGraded(true);
  }

  console.log("quizJSON:", quizJSON);
  return (
    <div className="quiz-open">
      {quizGraded ? (
        quizJSON.questions.map((question, index) => {
          return (
            <div key={index} id={`question-${index}`}>
              <div>Question {index + 1}.</div>
              <div>{question.question}</div>
              <fieldset id={`options-${index}`}>
                {Object.entries(question.options).map(([key, value]) => {
                  console.log(answers[`option-${index}`]);
                  if (
                    answers[`option-${index}`].answer ==
                      question.correct_answer &&
                    question.correct_answer == key
                  ) {
                    return (
                      <>
                        <label
                          htmlFor={value}
                          key={key}
                          style={{
                            display: "flex",
                            backgroundColor: "green",
                          }}
                        >
                          {key}:{" "}
                          <label
                            type="radio"
                            disabled={true}
                            value={key}
                            id={value}
                            name={`option-${index}`}
                          />{" "}
                          {value}
                        </label>
                      </>
                    );
                  } else if (answers[`option-${index}`].answer == key) {
                    return (
                      <>
                        <label
                          htmlFor={value}
                          key={key}
                          style={{
                            display: "flex",
                            backgroundColor: "red",
                          }}
                        >
                          {key}:{" "}
                          <label
                            type="radio"
                            disabled={true}
                            value={key}
                            id={value}
                            name={`option-${index}`}
                          />{" "}
                          {value}
                        </label>
                      </>
                    );
                  } else if (question.correct_answer == key) {
                    return (
                      <>
                        <label
                          htmlFor={value}
                          key={key}
                          style={{
                            display: "flex",
                            backgroundColor: "green",
                          }}
                        >
                          {key}:{" "}
                          <label
                            type="radio"
                            disabled={true}
                            value={key}
                            id={value}
                            name={`option-${index}`}
                          />{" "}
                          {value}
                        </label>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <label
                          htmlFor={value}
                          key={key}
                          style={{
                            display: "flex",
                          }}
                        >
                          {key}:{" "}
                          <label
                            type="radio"
                            disabled={true}
                            value={key}
                            id={value}
                            name={`option-${index}`}
                          />{" "}
                          {value}
                        </label>
                      </>
                    );
                  }
                })}
              </fieldset>
              <div>Correct answer: {question.correct_answer}</div>
              {question.explanation}
            </div>
          );
        })
      ) : (
        <form onSubmit={submitQuiz}>
          {quizJSON.questions.map((question, index) => {
            return (
              <div key={index} id={`question-${index}`}>
                <div>Question {index + 1}.</div>
                <div>{question.question}</div>
                <fieldset id={`options-${index}`}>
                  {Object.entries(question.options).map(([key, value]) => {
                    return (
                      <>
                        <label
                          htmlFor={value}
                          key={key}
                          style={{ display: "flex" }}
                        >
                          {key}:{" "}
                          <input
                            type="radio"
                            value={key}
                            id={value}
                            name={`option-${index}`}
                          />{" "}
                          {value}
                        </label>
                      </>
                    );
                  })}
                </fieldset>
              </div>
            );
          })}
          <button type="submit">Submit</button>
        </form>
      )}
      {quizGraded && (
        <>
        <div>Result: </div>
        <div>{correctAnswers} out of {(Object.entries(answers).length)} Correct</div>
        <div>{Math.floor((correctAnswers / (Object.entries(answers).length)) * 100)}%</div>
        <button onClick={() => setQuizGraded(false)}>Try Again</button>
        </>
      )}
      <button onClick={() => setQuizActive(false)}>Return</button>
    </div>
  );
}
