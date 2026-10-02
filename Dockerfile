FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git
WORKDIR /app

COPY backend/go.mod backend/go.sum ./backend/
WORKDIR /app/backend
RUN go mod download

WORKDIR /app
COPY . .
WORKDIR /app/backend
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /api ./cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /api .

EXPOSE 8080

CMD ["./api"]