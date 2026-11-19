//go:build !js || !wasm

package main

import (
	"fmt"
	"io"
	"os"

	"github.com/leekmny/study-quiz-go/internal/port"
)

func main() {
	if len(os.Args) == 2 && (os.Args[1] == "--help" || os.Args[1] == "-h") {
		fmt.Println("Usage: studyquiz [request.json|-]")
		fmt.Println("Read one JSON request from a file or standard input and write one JSON response.")
		return
	}
	if len(os.Args) > 2 {
		fmt.Fprintln(os.Stderr, "Usage: studyquiz [request.json|-]")
		os.Exit(2)
	}
	var input []byte
	var err error
	if len(os.Args) == 2 && os.Args[1] != "-" {
		input, err = os.ReadFile(os.Args[1])
	} else {
		input, err = io.ReadAll(os.Stdin)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println(string(port.Invoke(input)))
}
