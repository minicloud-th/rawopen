//go:build js && wasm

package main

import (
	"math"
	"opencraft/backend/market"
	"syscall/js"
)

type rustMoney struct{ host js.Value }

func (m rustMoney) invoke(name string, args ...any) (value int64, ok bool) {
	defer func() {
		if recover() != nil {
			ok = false
		}
	}()
	result := m.host.Call(name, args...)
	if result.Type() != js.TypeNumber {
		return 0, false
	}
	number := result.Float()
	if math.IsNaN(number) || math.IsInf(number, 0) || number < 0 || number > 9007199254740991 || math.Trunc(number) != number {
		return 0, false
	}
	return int64(number), true
}
func (m rustMoney) Parse(text string) (int64, bool) { return m.invoke("parse", text) }
func (m rustMoney) Line(unit int64, quantity int) (int64, bool) {
	return m.invoke("line", float64(unit), quantity)
}
func (m rustMoney) Add(left, right int64) (int64, bool) {
	return m.invoke("add", float64(left), float64(right))
}

func main() {
	var api *market.API
	done := make(chan struct{})
	stopped := false
	start := js.FuncOf(func(_ js.Value, args []js.Value) any {
		if len(args) != 2 || args[0].Type() != js.TypeString {
			return "invalid-start"
		}
		next, err := market.New(args[0].String(), rustMoney{args[1]})
		if err != nil {
			return "catalog-unavailable"
		}
		api = next
		return ""
	})
	handle := js.FuncOf(func(_ js.Value, args []js.Value) any {
		if api == nil || len(args) != 1 || args[0].Type() != js.TypeString {
			return `{"status":503,"body":{"error":"api-unavailable"}}`
		}
		return api.HandleJSON(args[0].String())
	})
	js.Global().Set("__opencraftGoStart", start)
	js.Global().Set("__opencraftGoHandle", handle)
	stop := js.FuncOf(func(_ js.Value, _ []js.Value) any {
		if !stopped {
			stopped = true
			close(done)
		}
		return nil
	})
	js.Global().Set("__opencraftGoStop", stop)
	<-done
}
