package market

import (
	"encoding/json"
	"errors"
	"io"
	"sort"
	"strings"
	"unicode/utf8"
)

// Money is implemented by the actual Rust Wasm module in the Worker host.
type Money interface {
	Parse(string) (int64, bool)
	Line(int64, int) (int64, bool)
	Add(int64, int64) (int64, bool)
}
type product struct {
	ID          string      `json:"id"`
	Type        string      `json:"type"`
	Category    string      `json:"cat"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Seller      string      `json:"seller"`
	Tags        string      `json:"tags"`
	Price       json.Number `json:"price"`
	raw         json.RawMessage
	satang      int64
}
type API struct {
	products   []product
	categories map[string]bool
	money      Money
}
type Request struct {
	Method string            `json:"method"`
	Path   string            `json:"path"`
	Query  map[string]string `json:"query"`
	Body   string            `json:"body"`
}
type Response struct {
	Status int `json:"status"`
	Body   any `json:"body"`
}
type CartLine struct {
	ID       string `json:"id"`
	Quantity int    `json:"quantity"`
}
type QuoteLine struct {
	ID         string `json:"id"`
	Quantity   int    `json:"quantity"`
	UnitSatang int64  `json:"unitSatang"`
	LineSatang int64  `json:"lineSatang"`
}

func New(seed string, money Money) (*API, error) {
	var data struct {
		Products   []json.RawMessage `json:"products"`
		Categories []struct {
			ID string `json:"id"`
		} `json:"categories"`
	}
	if err := json.Unmarshal([]byte(seed), &data); err != nil || len(data.Products) == 0 {
		return nil, errors.New("invalid catalog")
	}
	api := &API{money: money, categories: map[string]bool{"all": true}}
	for _, category := range data.Categories {
		api.categories[category.ID] = true
	}
	seen := map[string]bool{}
	for _, raw := range data.Products {
		var p product
		if json.Unmarshal(raw, &p) != nil || p.ID == "" || seen[p.ID] || !api.categories[p.Category] || !oneOf(p.Type, "physical", "digital", "service") {
			return nil, errors.New("invalid catalog product")
		}
		amount, ok := money.Parse(p.Price.String())
		if !ok {
			return nil, errors.New("invalid catalog price")
		}
		p.raw, p.satang = raw, amount
		api.products = append(api.products, p)
		seen[p.ID] = true
	}
	return api, nil
}
func oneOf(value string, values ...string) bool {
	for _, option := range values {
		if value == option {
			return true
		}
	}
	return false
}
func problem(status int, code string) Response {
	return Response{status, map[string]string{"error": code}}
}
func decode(body string, target any) bool {
	if len(body) > 32768 {
		return false
	}
	decoder := json.NewDecoder(strings.NewReader(body))
	decoder.DisallowUnknownFields()
	if decoder.Decode(target) != nil {
		return false
	}
	var extra any
	return decoder.Decode(&extra) == io.EOF
}

func (a *API) HandleJSON(input string) (output string) {
	defer func() {
		if recover() != nil {
			output = `{"status":503,"body":{"error":"engine-unavailable"}}`
		}
	}()
	var request Request
	response := problem(400, "invalid-request")
	if len(input) <= 65536 && decode(input, &request) {
		response = a.Handle(request)
	}
	raw, err := json.Marshal(response)
	if err != nil {
		return `{"status":500,"body":{"error":"response-unavailable"}}`
	}
	return string(raw)
}
func (a *API) Handle(request Request) Response {
	switch request.Path {
	case "/api/catalog":
		if request.Method != "GET" {
			return problem(405, "method-not-allowed")
		}
		return a.catalog(request.Query)
	case "/api/quote":
		if request.Method != "POST" {
			return problem(405, "method-not-allowed")
		}
		return a.quote(request.Body)
	case "/api/topup/preview":
		if request.Method != "POST" {
			return problem(405, "method-not-allowed")
		}
		return a.topup(request.Body)
	case "/api/runtime":
		if request.Method != "GET" {
			return problem(405, "method-not-allowed")
		}
		proof, ok := a.money.Line(129000, 2)
		if !ok || proof != 258000 {
			return problem(503, "engine-unavailable")
		}
		return Response{200, map[string]any{"api": "Go", "engine": "Rust/Wasm", "transport": "Cloudflare Worker", "currency": "THB", "paymentsEnabled": false, "engineCheck": proof}}
	default:
		return problem(404, "not-found")
	}
}
func (a *API) catalog(query map[string]string) Response {
	q, category, filter, order := strings.TrimSpace(query["q"]), query["category"], query["filter"], query["sort"]
	if category == "" {
		category = "all"
	}
	if filter == "" {
		filter = "all"
	}
	if order == "" {
		order = "recommended"
	}
	if utf8.RuneCountInString(q) > 200 || !a.categories[category] || !oneOf(filter, "all", "physical", "digital", "service") || !oneOf(order, "recommended", "newest", "price-asc", "price-desc") {
		return problem(400, "invalid-filter")
	}
	q = strings.ToLower(q)
	found := make([]product, 0)
	for _, p := range a.products {
		if category != "all" && p.Category != category || filter != "all" && p.Type != filter {
			continue
		}
		if q != "" && !strings.Contains(strings.ToLower(p.Title+" "+p.Description+" "+p.Tags+" "+p.Seller), q) {
			continue
		}
		found = append(found, p)
	}
	if order == "price-asc" || order == "price-desc" {
		sort.SliceStable(found, func(i, j int) bool {
			if order == "price-asc" {
				return found[i].satang < found[j].satang
			}
			return found[i].satang > found[j].satang
		})
	}
	if order == "newest" {
		for i, j := 0, len(found)-1; i < j; i, j = i+1, j-1 {
			found[i], found[j] = found[j], found[i]
		}
	}
	result := make([]json.RawMessage, 0, len(found))
	for _, p := range found {
		result = append(result, p.raw)
	}
	return Response{200, map[string]any{"products": result, "count": len(result), "currency": "THB", "sampleCatalog": true}}
}
func (a *API) quote(body string) Response {
	var input struct {
		Items []CartLine `json:"items"`
	}
	if !decode(body, &input) || len(input.Items) > 50 {
		return problem(400, "invalid-cart")
	}
	lines, total, seen := make([]QuoteLine, 0, len(input.Items)), int64(0), map[string]bool{}
	for _, entry := range input.Items {
		if seen[entry.ID] {
			return problem(400, "duplicate-item")
		}
		seen[entry.ID] = true
		var selected *product
		for i := range a.products {
			if a.products[i].ID == entry.ID {
				selected = &a.products[i]
				break
			}
		}
		if selected == nil {
			return problem(400, "unknown-product")
		}
		if entry.Quantity < 1 || entry.Quantity > 9 || selected.Type != "physical" && entry.Quantity != 1 {
			return problem(400, "invalid-quantity")
		}
		line, ok := a.money.Line(selected.satang, entry.Quantity)
		if !ok {
			return problem(400, "amount-out-of-range")
		}
		total, ok = a.money.Add(total, line)
		if !ok {
			return problem(400, "amount-out-of-range")
		}
		lines = append(lines, QuoteLine{entry.ID, entry.Quantity, selected.satang, line})
	}
	return Response{200, map[string]any{"items": lines, "totalSatang": total, "currency": "THB", "checkoutEnabled": false}}
}
func (a *API) topup(body string) Response {
	var input struct {
		Amount string `json:"amount"`
		Method string `json:"method"`
	}
	if !decode(body, &input) || !oneOf(input.Method, "promptpay", "card") || len(input.Amount) > 64 {
		return problem(400, "invalid-topup")
	}
	amount, ok := a.money.Parse(strings.TrimSpace(input.Amount))
	if !ok || amount <= 0 {
		return problem(400, "invalid-amount")
	}
	return Response{200, map[string]any{"amountSatang": amount, "method": input.Method, "currency": "THB", "paymentsEnabled": false}}
}
