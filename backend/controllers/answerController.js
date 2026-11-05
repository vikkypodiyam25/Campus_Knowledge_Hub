
const Answer = require("../models/Answer");
const Question = require("../models/question");

// Create an answer
exports.createAnswer = async (req, res) => {
  try {
    const { content } = req.body;
    const { questionId } = req.params;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Answer content is required",
      });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const answer = await Answer.create({
      question: questionId,
      author: req.user._id,
      content,
    });

    question.status = "answered";
    await question.save();

    res.status(201).json({
      success: true,
      message: "Answer submitted successfully",
      data: answer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get answers of a question
exports.getAnswersByQuestion = async (req, res) => {
  try {
    const answers = await Answer.find({
      question: req.params.questionId,
    })
      .populate("author", "name username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: answers.length,
      data: answers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Accept an answer
exports.acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    const question = await Question.findById(answer.question);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Only question owner can accept an answer
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the question owner can accept an answer",
      });
    }

    // Reset previously accepted answers
    await Answer.updateMany(
      { question: question._id },
      { isAccepted: false }
    );

    answer.isAccepted = true;
    await answer.save();

    question.status = "resolved";
    await question.save();

    res.status(200).json({
      success: true,
      message: "Answer accepted successfully",
      data: answer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
