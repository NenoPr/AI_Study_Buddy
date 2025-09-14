import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Select from "react-select";
const API_BASE = import.meta.env.VITE_API_URL;

export default function Quiz({ quizJSON, setQuizActive }) {
  const [answers, setAnswers] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizGraded, setQuizGraded] = useState(false);

  function submitQuiz(e) {
    e.preventDefault();
    console.log(e.target);
    const formData = new FormData(e.target);
    let corrAnswers = 0;
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
        newAnswers[`option-${key}`].isCorrect = true;
        corrAnswers = corrAnswers + 1;
      }
    });
    console.log("Selected answers after check: ", newAnswers);
    setAnswers(newAnswers);
    setCorrectAnswers(corrAnswers);
    setQuizGraded(true);
  }

  console.log("quizJSON:", quizJSON);
  return (
    <div className="quiz-open">
      {quizGraded ? (
        quizJSON.questions.map((question, index) => {
          return (
            <>
              <div
                key={index}
                id={`question-${index}`}
                className="quiz-question"
              >
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
                            htmlFor={`${value}-${index}`}
                            key={key}
                            style={{ display: "flex" }}
                            class="flex bg-green-500"
                          >
                            <div class="flex gap-2 flex-1 items-center content-center">
                              <div class="flex-0">{key}:</div>
                            </div>
                            <div class="flex-10 text-left">{value}</div>
                          </label>
                        </>
                      );
                    } else if (answers[`option-${index}`].answer == key) {
                      return (
                        <>
                          <label
                            htmlFor={`${value}-${index}`}
                            key={key}
                            style={{ display: "flex" }}
                            class="flex bg-red-500"
                          >
                            <div class="flex gap-2 flex-1 items-center content-center">
                              <div class="flex-0">{key}:</div>
                            </div>
                            <div class="flex-10 text-left">{value}</div>
                          </label>
                        </>
                      );
                    } else if (question.correct_answer == key) {
                      return (
                        <>
                          <label
                            htmlFor={`${value}-${index}`}
                            key={key}
                            style={{ display: "flex" }}
                            class="flex bg-green-500"
                          >
                            <div class="flex gap-2 flex-1 items-center content-center">
                              <div class="flex-0">{key}:</div>
                            </div>
                            <div class="flex-10 text-left">{value}</div>
                          </label>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <label
                            htmlFor={`${value}-${index}`}
                            key={key}
                            style={{ display: "flex" }}
                            class="flex"
                          >
                            <div class="flex gap-2 flex-1 items-center content-center">
                              <div class="flex-0">{key}:</div>
                            </div>
                            <div class="flex-10 text-left">{value}</div>
                          </label>
                        </>
                      );
                    }
                  })}
                </fieldset>
                <div>Correct answer: {question.correct_answer}</div>
                {question.explanation}
              </div>
              <div class="border-2 w-full"></div>
            </>
          );
        })
      ) : (
        <form onSubmit={submitQuiz} className="quiz-open">
          {quizJSON.questions.map((question, index) => {
            return (
              <>
                <div
                  key={index}
                  id={`question-${index}`}
                  className="quiz-question"
                >
                  <div>Question {index + 1}.</div>
                  <div class="text-left">{question.question}</div>
                  <fieldset id={`options-${index}`} className="quiz-options">
                    {Object.entries(question.options).map(([key, value]) => {
                      return (
                        <>
                          <label
                            htmlFor={`${value}-${index}`}
                            key={key}
                            style={{ display: "flex" }}
                            className="quiz-option"
                          >
                            <div class="flex gap-2 flex-1 items-center content-center">
                              <div class="flex-0">{key}:</div>
                              <input
                                type="radio"
                                value={key}
                                id={`${value}-${index}`}
                                name={`option-${index}`}
                                class="flex-0"
                              />
                            </div>
                            <div class="flex-10 text-left">{value}</div>
                          </label>
                        </>
                      );
                    })}
                  </fieldset>
                </div>
                <div class="border-2 w-full"></div>
              </>
            );
          })}
          <button type="submit">Submit</button>
        </form>
      )}
      {quizGraded && (
        <>
          <div>
            Result: {correctAnswers} out of {Object.entries(answers).length}{" "}
            Correct
          </div>
          <div>
            {Math.floor(
              (correctAnswers / Object.entries(answers).length) * 100
            )}
            %
          </div>
          <button onClick={() => setQuizGraded(false)}>Try Again</button>
        </>
      )}
      <button onClick={() => setQuizActive(false)}>Return</button>
    </div>
  );
}
