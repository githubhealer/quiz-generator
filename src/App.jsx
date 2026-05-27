import { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  function handleFileSelect(event) {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  }

  async function handleGenerate() {
    if (!file) return alert("Please select a PDF first!");

    setIsLoading(true);

    try {
      // 1. Get upload URL
      const apiResponse = await fetch(
        "https://7s5jpby6yl.execute-api.us-east-1.amazonaws.com/upload-link"
      );

      const { uploadURL, filename } = await apiResponse.json();

      // 2. Upload PDF
      await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: file,
      });

      // 3. Generate Quiz
      const generateResponse = await fetch(
        "https://7b0kteo4z5.execute-api.us-east-1.amazonaws.com/generate-quiz",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filename }),
        }
      );

      const resultData = await generateResponse.json();

      // Expected JSON format from backend
      // [
      //   {
      //     question: "",
      //     options: ["", "", "", ""],
      //     answer: ""
      //   }
      // ]

      setQuizData(resultData.quiz);

    } catch (error) {
      console.log(error);
      alert("Error generating quiz");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOptionClick(option) {
    if (showAnswer) return;

    setSelectedOption(option);
    setShowAnswer(true);

    const currentQuiz = quizData[currentQuestion];

    if (option === currentQuiz.answer) {
      setScore((prev) => prev + 1);
    }
  }

  function handleNextQuestion() {
    setSelectedOption(null);
    setShowAnswer(false);

    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  const currentQuiz = quizData[currentQuestion];

  return (
    <div className="app">
      {!quizData.length ? (
        <div className="upload-card">
          <h1>Quiz Generator</h1>
          <p>Upload a PDF to generate interactive MCQs</p>

          <label className="upload-btn">
            Choose PDF
            <input type="file" accept=".pdf" onChange={handleFileSelect} hidden />
          </label>

          <div className="file-name">
            {file ? file.name : "No file selected"}
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      ) : (
        <div className="quiz-container">
          <div className="quiz-header">
            <div>
              <h2>MCQ Practice</h2>
              <p>
                Question {currentQuestion + 1} of {quizData.length}
              </p>
            </div>

            <div className="score-box">
              Score: {score}
            </div>
          </div>

          <div className="question-card">
            <h3>{currentQuiz.question}</h3>

            <div className="options-container">
              {currentQuiz.options.map((option, index) => {
                let className = "option-card";

                if (showAnswer) {
                  if (option === currentQuiz.answer) {
                    className += " correct";
                  } else if (option === selectedOption) {
                    className += " wrong";
                  }
                }

                return (
                  <button
                    key={index}
                    className={className}
                    onClick={() => handleOptionClick(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {showAnswer && currentQuestion < quizData.length - 1 && (
              <button className="next-btn" onClick={handleNextQuestion}>
                Next Question
              </button>
            )}

            {showAnswer && currentQuestion === quizData.length - 1 && (
              <div className="final-score">
                Quiz Completed 🎉 <br />
                Your Score: {score} / {quizData.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;