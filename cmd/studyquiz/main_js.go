//go:build js && wasm

package main

import (
	"syscall/js"

	"github.com/leekmny/study-quiz-go/internal/port"
)

func main() {
	invoke := js.FuncOf(func(_ js.Value, args []js.Value) any {
		if len(args) != 1 || args[0].Type() != js.TypeString {
			return `{"ok":false,"error":"expected one JSON string"}`
		}
		return string(port.Invoke([]byte(args[0].String())))
	})
	js.Global().Set("studyQuizGo", invoke)
	defer invoke.Release()
	select {}
}
