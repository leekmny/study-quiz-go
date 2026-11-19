package port

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"slices"
	"strings"
	"time"

	studyquiz "github.com/leekmny/study-quiz-go"
)

type Question struct {
	ID            int       `json:"id"`
	Category      string    `json:"category"`
	Difficulty    string    `json:"difficulty"`
	Question      string    `json:"question"`
	Options       [4]string `json:"options"`
	CorrectAnswer int       `json:"correctAnswer"`
	Explanation   string    `json:"explanation"`
	ReviewStatus  string    `json:"reviewStatus,omitempty"`
	Hint          string    `json:"hint"`
	Sources       []string  `json:"sources"`
	VerifiedAt    string    `json:"verifiedAt,omitempty"`
	HintSource    string    `json:"hintSource,omitempty"`
	OptionOrder   [4]int    `json:"optionOrder"`
}

var koreanQuestions, koreanBankError = decodeQuestionBank(studyquiz.KoreanQuestionSource)
var englishQuestions, englishBankError = decodeQuestionBank(studyquiz.EnglishQuestionSource)

func decodeQuestionBank(source string) ([]Question, error) {
	// Both original modules assign a JSON array to a top-level variable.
	_, array, exists := strings.Cut(source, " = [")
	if !exists {
		return nil, errors.New("question bank has no data")
	}
	var questions []Question
	if err := json.NewDecoder(strings.NewReader("[" + array)).Decode(&questions); err != nil {
		return nil, fmt.Errorf("read question bank: %w", err)
	}
	for _, question := range questions {
		if question.CorrectAnswer < 0 || question.CorrectAnswer >= len(question.Options) {
			return nil, fmt.Errorf("question %d has an invalid answer index", question.ID)
		}
	}
	return questions, nil
}

func randomSource(values []float64) (func() float64, error) {
	if len(values) == 0 {
		return rand.Float64, nil
	}
	for _, value := range values {
		if value < 0 || value >= 1 {
			return nil, errors.New("random values must be at least zero and less than one")
		}
	}
	position := 0
	return func() float64 {
		value := values[position]
		position = (position + 1) % len(values)
		return value
	}, nil
}

func shuffle[T any](items []T, random func() float64) {
	for i := len(items) - 1; i > 0; i-- {
		j := int(random() * float64(i+1))
		items[i], items[j] = items[j], items[i]
	}
}

func dailyRandom(date string, now int64) (func() float64, error) {
	day := time.UnixMilli(now)
	if date != "" {
		var err error
		day, err = time.Parse(time.DateOnly, date)
		if err != nil {
			return nil, fmt.Errorf("invalid daily date: %w", err)
		}
	}
	seed := uint32(day.Year()*10_000 + int(day.Month())*100 + day.Day())
	return func() float64 {
		seed = 1_664_525*seed + 1_013_904_223
		return float64(seed) / (1 << 32)
	}, nil
}

func makePool(req Request, random func() float64) ([]Question, error) {
	if koreanBankError != nil {
		return nil, koreanBankError
	}
	length := req.Length
	if req.Mode == "daily" {
		var err error
		random, err = dailyRandom(req.Date, req.Now)
		if err != nil {
			return nil, err
		}
		length = 10
	}
	pool := make([]Question, 0, len(koreanQuestions))
	for _, question := range koreanQuestions {
		switch {
		case req.IDs != nil:
			if !slices.Contains(req.IDs, question.ID) {
				continue
			}
		case req.Mode == "review":
			if !slices.Contains(req.MissedIDs, question.ID) {
				continue
			}
		case req.Mode == "category":
			if question.Category != req.Category {
				continue
			}
		}
		if req.Mode != "daily" {
			switch req.Difficulty {
			case "easy", "medium", "hard":
				if question.Difficulty != req.Difficulty {
					continue
				}
			}
		}
		pool = append(pool, question)
	}
	shuffle(pool, random)
	if length > 0 && length < len(pool) {
		pool = pool[:length]
	}
	for i := range pool {
		question := &pool[i]
		question.OptionOrder = [4]int{0, 1, 2, 3}
		shuffle(question.OptionOrder[:], random)
		options := question.Options
		question.CorrectAnswer = slices.Index(question.OptionOrder[:], question.CorrectAnswer)
		for j, original := range question.OptionOrder {
			question.Options[j] = options[original]
		}
	}
	return pool, nil
}

func localizedQuestion(q Question, language string) Question {
	if language != "en" {
		return q
	}
	for _, english := range englishQuestions {
		if english.ID == q.ID {
			q.Question, q.Explanation, q.Hint = english.Question, english.Explanation, english.Hint
			for i, original := range q.OptionOrder {
				if original >= 0 && original < len(english.Options) {
					q.Options[i] = english.Options[original]
				}
			}
			break
		}
	}
	return q
}
